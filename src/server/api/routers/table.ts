import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { columns, rows } from "~/server/db/schema";
import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createIndexesForColumn } from "~/server/db/columnIndexes";

const filterSchema = z.object({
  columnId: z.string(),
  operator: z.enum([
    "contains",
    "doesNotContain",
    "is",
    "isNot",
    "isEmpty",
    "isNotEmpty",
    "gt",
    "lt",
  ]),
  value: z.union([z.string(), z.number()]).optional(),
});

const sortSchema = z.object({
  columnId: z.string(),
  direction: z.enum(["asc", "desc"])
});

const createColumnSchema = z.object({
  tableId: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(["text", "number", "singleSelect", "attachment"]),
  orderIndex: z.number().int().min(0).default(0)
});

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function keyLiteral(columnId: string) {
  if (!uuidRe.test(columnId)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid columnId" });
  }
  const escaped = columnId.replaceAll("'", "''");
  return sql.raw(`'${escaped}'`);
}

export const tableRouter = createTRPCRouter({
  getColumns: protectedProcedure
    .input(z.object({ tableId: z.string().uuid() }))
    .query(async ({ input }) => {
      return db
        .select()
        .from(columns)
        .where(eq(columns.tableId, input.tableId))
        .orderBy(columns.orderIndex);
    }),

  createColumn: protectedProcedure
    .input(createColumnSchema)
    .mutation(async ({ input }) => {
      const [col] = await db
        .insert(columns)
        .values({
          tableId: input.tableId,
          name: input.name,
          type: input.type,
          orderIndex: input.orderIndex
        })
        .returning({
          id: columns.id,
          tableId: columns.tableId,
          type: columns.type
        });

      if (!col) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create column"
        });
      }

      // Create indexes for this new column
      await createIndexesForColumn({
        tableId: col.tableId,
        columnId: col.id,
        type: col.type
      });

      return col;
    }),

  getRows: protectedProcedure
    .input(
      z.object({
        tableId: z.string().uuid(),
        startIndex: z.number().int().min(0).default(0),
        windowSize: z.number().int().min(1).max(1000).default(300),
        filters: z.array(filterSchema).optional(),
        sort: z.array(sortSchema).optional()
      })
    )
    .query(async ({ input }) => {
      const { tableId, startIndex, windowSize } = input;

      const hasFilters = (input.filters?.length ?? 0) > 0;
      const hasSort = (input.sort?.length ?? 0) > 0;

      const cols = await db
        .select({ id: columns.id, type: columns.type })
        .from(columns)
        .where(eq(columns.tableId, tableId));

      const colTypeById = new Map(cols.map(c => [c.id, c.type]));

      const baseWhere: SQL[] = [eq(rows.tableId, tableId)];

      if (hasFilters) {
        for (const f of input.filters!) {
          const colType = colTypeById.get(f.columnId);
          if (!colType) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown columnId in filters" });
          }

          const colText = sql`(${rows.values} ->> ${keyLiteral(f.columnId)})`;
          const trimmed = sql`btrim(coalesce(${colText}, ''))`;

          // Empty operators (no value needed)
          if (f.operator === "isEmpty") {
            baseWhere.push(sql`${trimmed} = ''`);
            continue;
          }
          if (f.operator === "isNotEmpty") {
            baseWhere.push(sql`${trimmed} <> ''`);
            continue;
          }

          // From here, we need a value
          const v = f.value;
          if (v === undefined || v === null || String(v).length === 0) continue;

          if (colType === "number") {
            const n = Number(v);
            if (!Number.isFinite(n)) continue;
            // use n instead of Number(v) repeatedly
          }

          // Text-like columns
          if (colType !== "number") {
            if (f.operator === "gt" || f.operator === "lt") {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Operator ${f.operator} not supported for non-number columns`
              });
            }

            if (f.operator === "contains") {
              baseWhere.push(sql`${colText} ILIKE ${"%" + String(v) + "%"}`);
            } else if (f.operator === "doesNotContain") {
              baseWhere.push(sql`NOT (${colText} ILIKE ${"%" + String(v) + "%"})`);
            } else if (f.operator === "is") {
              baseWhere.push(sql`${colText} = ${String(v)}`);
            } else if (f.operator === "isNot") {
              baseWhere.push(sql`${colText} IS DISTINCT FROM ${String(v)}`);
            }
            continue;
          }

          // Number column behaviour (optional: support only is/isNot for now)
          const numExpr = sql`(nullif(${trimmed}, '')::double precision)`;

          if (f.operator === "is") {
            baseWhere.push(sql`${numExpr} = ${Number(v)}`);
          } else if (f.operator === "isNot") {
            baseWhere.push(sql`${numExpr} IS DISTINCT FROM ${Number(v)}`);
          } else if (f.operator === "gt") {
            baseWhere.push(sql`${numExpr} > ${Number(v)}`);
          } else if (f.operator === "lt") {
            baseWhere.push(sql`${numExpr} < ${Number(v)}`);
          } else if (
            f.operator === "contains" ||
            f.operator === "doesNotContain"
          ) {
            // ignore or throw
          }
        }
      }


      const [{ count } = { count: 0 }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(rows)
        .where(and(...baseWhere));

      const totalCount = count;
      if (totalCount === 0) return { rows: [], totalCount: 0, windowStart: 0 };

      const safeFrom = Math.max(0, Math.min(startIndex, Math.max(0, totalCount - 1)));

      if (!hasFilters && !hasSort) {
        const fromIndex = safeFrom;
        const toIndex = fromIndex + windowSize - 1;

        const windowWhere: SQL[] = [...baseWhere, gte(rows.index, fromIndex), lte(rows.index, toIndex)];

        const result = await db
          .select()
          .from(rows)
          .where(and(...windowWhere))
          .orderBy(sql`${rows.index} asc`, sql`${rows.id} asc`)
          .limit(windowSize);

        return { rows: result, totalCount, windowStart: fromIndex };
      }

      const orderParts: SQL[] = [];
      if (hasSort) {
        for (const s of input.sort!) {
          const colType = colTypeById.get(s.columnId);
          if (!colType) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown columnId in sort" });
          }

          const colJsonText = sql`(${rows.values} ->> ${keyLiteral(s.columnId)})`;
          const sortExpr =
            colType === "number"
              ? sql`(nullif(${colJsonText}, '')::double precision)`
              : colJsonText;

          orderParts.push(
            s.direction === "asc"
              ? sql`${sortExpr} asc nulls last`
              : sql`${sortExpr} desc nulls last`
          );
        }
      } else {
        orderParts.push(sql`${rows.index} asc`);
      }

      orderParts.push(sql`${rows.id} asc`);

      const result = await db
        .select()
        .from(rows)
        .where(and(...baseWhere))
        .orderBy(...orderParts)
        .limit(windowSize)
        .offset(safeFrom);

      return { rows: result, totalCount, windowStart: safeFrom };
    })
});
