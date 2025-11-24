import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { columns, rows } from "~/server/db/schema";
import { and, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { z } from "zod";

const filterSchema = z.object({
  columnId: z.string(),
  operator: z.enum(["contains", "equals", "gt", "lt"]),
  value: z.union([z.string(), z.number()])
});

const sortSchema = z.object({
  columnId: z.string(),
  direction: z.enum(["asc", "desc"])
});

export const tableRouter = createTRPCRouter({
  getColumns: protectedProcedure
    .input(z.object({ tableId: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(columns)
        .where(eq(columns.tableId, input.tableId))
        .orderBy(columns.orderIndex);
      return result;
    }),

  // WINDOWED RANDOM-ACCESS getRows
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

      const fromIndex = startIndex;
      const toIndex = startIndex + windowSize - 1;

      // ----- BASE WHERE (no index window) -----
      const baseWhere: SQL[] = [eq(rows.tableId, tableId)];

      if (input.filters && input.filters.length > 0) {
        for (const f of input.filters) {
          const colJson = sql`(${rows.values} ->> ${f.columnId})`;

          if (f.operator === "contains") {
            baseWhere.push(
              sql`${colJson} ILIKE ${"%" + String(f.value) + "%"}`
            );
          } else if (f.operator === "equals") {
            baseWhere.push(sql`${colJson} = ${String(f.value)}`);
          } else if (f.operator === "gt") {
            baseWhere.push(
              sql`${colJson}::double precision > ${Number(f.value)}`
            );
          } else if (f.operator === "lt") {
            baseWhere.push(
              sql`${colJson}::double precision < ${Number(f.value)}`
            );
          }
        }
      }

      // ----- TOTAL COUNT for this table + filters -----
      const [{ count } = { count: 0 }] = await db
        .select({
          count: sql<number>`cast(count(*) as int)`
        })
        .from(rows)
        .where(and(...baseWhere));

      const totalCount = count;

      if (totalCount === 0) {
        return {
          rows: [],
          totalCount: 0
        };
      }

      // clamp window so we don't go beyond totalCount
      const safeFrom = Math.max(0, Math.min(fromIndex, Math.max(0, totalCount - 1)));
      const safeTo = Math.max(
        safeFrom,
        Math.min(toIndex, totalCount - 1)
      );

      // ----- WINDOW WHERE (add index range) -----
      const windowWhere: SQL[] = [
        ...baseWhere,
        gte(rows.index, safeFrom),
        lte(rows.index, safeTo)
      ];

      // ----- ORDER BY -----
      const orderParts: SQL[] = [];

      if (input.sort && input.sort.length > 0) {
        for (const s of input.sort) {
          const colJson = sql`(${rows.values} ->> ${s.columnId})`;

          const orderExpr: SQL =
            s.direction === "asc"
              ? sql`${colJson} asc`
              : sql`${colJson} desc`;

          orderParts.push(orderExpr);
        }
      }

      // always add stable secondary ordering by index
      orderParts.push(sql`${rows.index} asc`);

      const result = await db
        .select()
        .from(rows)
        .where(and(...windowWhere))
        .orderBy(...orderParts)
        .limit(windowSize);

      return {
        rows: result,
        totalCount
      };
    })
});
