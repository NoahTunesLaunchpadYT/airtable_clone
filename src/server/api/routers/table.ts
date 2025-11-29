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

const columnType = z.enum(["text", "number", "singleSelect", "attachment"])

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

  createRow: protectedProcedure
    .input(z.object({ tableId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Optional: verify the user owns the table via joins (base -> owner/workspace)
      const res = await ctx.db
        .select({
          maxIndex: sql<number | null>`max(${rows.index})`,
        })
        .from(rows)
        .where(eq(rows.tableId, input.tableId))

      const maxIndex = res[0]?.maxIndex ?? null
      const nextIndex = (maxIndex ?? -1) + 1

      const [inserted] = await ctx.db
        .insert(rows)
        .values({
          tableId: input.tableId,
          index: nextIndex,
          values: {}, // do NOT prefill every column key
        })
        .returning({ id: rows.id, index: rows.index })

      return inserted
    }),

  createColumn: protectedProcedure
    .input(
      z.object({
        tableId: z.string().uuid(),
        name: z.string().trim().min(1).max(120),
        type: columnType, // we will call with only "text" | "number" from UI
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db
        .select({
          maxIndex: sql<number | null>`max(${columns.orderIndex})`,
        })
        .from(columns)
        .where(eq(columns.tableId, input.tableId))

      const maxOrder = res[0]?.maxIndex ?? null
      const nextOrder = (maxOrder ?? -1) + 1

      const [inserted] = await ctx.db
        .insert(columns)
        .values({
          tableId: input.tableId,
          name: input.name,
          type: input.type,
          orderIndex: nextOrder,
          isHidden: false,
          config: null,
        })
        .returning({
          id: columns.id,
          name: columns.name,
          type: columns.type,
          orderIndex: columns.orderIndex,
        })

      // Create indexes for this new column
      if (inserted) {
        await createIndexesForColumn({
          tableId: input.tableId,
          columnId: inserted.id,
          type: input.type
        });
      }

      return inserted
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
    }),
    
  updateCell: protectedProcedure
    .input(
      z.object({
        rowId: z.string().uuid(),
        columnId: z.string().uuid(),
        value: z.union([z.string(), z.number(), z.null()]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.db.query.rows.findFirst({
        where: eq(rows.id, input.rowId),
      })
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Row not found" })

      const col = await ctx.db.query.columns.findFirst({
        where: eq(columns.id, input.columnId),
      })
      if (!col) throw new TRPCError({ code: "NOT_FOUND", message: "Column not found" })

      if (col.tableId !== row.tableId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Column does not belong to this row" })
      }

      // Adjust these enum checks to match your columnTypeEnum values.
      // Commonly they are "TEXT" | "NUMBER".
      const colType = col.type // "text" | "number" | "singleSelect" | "attachment"

      let nextVal: unknown = input.value

      if (colType === "number") {
        if (input.value == null) {
          nextVal = null
        } else if (typeof input.value === "number") {
          nextVal = Number.isFinite(input.value) ? input.value : null
        } else {
          const n = Number(String(input.value).trim())
          nextVal = Number.isFinite(n) ? n : null
        }
      }

      if (colType === "text" || colType === "singleSelect") {
        if (input.value == null) {
          nextVal = null
        } else {
          const s = String(input.value)
          nextVal = s.trim() === "" ? null : s
        }
      }

      // attachments should be JSON (array/object). Let it pass through as-is:
      if (colType === "attachment") {
        // optionally normalise empty string -> null
        if (input.value === "") nextVal = null
      }

      const current = (row.values ?? {}) as Record<string, unknown>
      const nextValues = { ...current, [input.columnId]: nextVal }

      await ctx.db.update(rows).set({ values: nextValues }).where(eq(rows.id, input.rowId))

      return { ok: true }
    }),
});
