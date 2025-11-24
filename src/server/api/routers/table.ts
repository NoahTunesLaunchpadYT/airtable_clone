import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { columns, rows } from "~/server/db/schema";
import { and, eq, sql, type SQL } from "drizzle-orm";
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

  getRows: protectedProcedure
    .input(
      z.object({
        tableId: z.string().uuid(),
        offset: z.number().default(0),
        limit: z.number().default(100),
        filters: z.array(filterSchema).optional(),
        sort: z.array(sortSchema).optional()
      })
    )
    .query(async ({ input }) => {
      // ----- WHERE -----
      const whereParts: SQL[] = [eq(rows.tableId, input.tableId)];

      if (input.filters && input.filters.length > 0) {
        for (const f of input.filters) {
          const colJson = sql`(${rows.values} ->> ${f.columnId})`;

          if (f.operator === "contains") {
            whereParts.push(
              sql`${colJson} ILIKE ${"%" + String(f.value) + "%"}`
            );
          } else if (f.operator === "equals") {
            whereParts.push(sql`${colJson} = ${String(f.value)}`);
          } else if (f.operator === "gt") {
            whereParts.push(
              sql`${colJson}::double precision > ${Number(f.value)}`
            );
          } else if (f.operator === "lt") {
            whereParts.push(
              sql`${colJson}::double precision < ${Number(f.value)}`
            );
          }
        }
      }

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

      // Build query
      const result = await db
        .select()
        .from(rows)
        .where(and(...whereParts))
        // spread dynamic SQL order parts, then stable secondary order by index
        .orderBy(...orderParts, rows.index)
        .limit(input.limit)
        .offset(input.offset);

      return result;
    })
});
