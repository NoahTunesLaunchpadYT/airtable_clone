import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { bases, tables, columns, rows } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { faker } from "@faker-js/faker";

export const baseRouter = createTRPCRouter({
  getBases: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const result = await db
      .select()
      .from(bases)
      .where(eq(bases.ownerId, userId));
    return result;
  }),

  getTablesForBase: protectedProcedure
    .input(z.object({ baseId: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(tables)
        .where(eq(tables.baseId, input.baseId))
        .orderBy(tables.orderIndex);
      return result;
    }),

  // Create demo base + table + 1000 rows
  createDemoBase: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // 1) create base
    const [base] = await db
      .insert(bases)
      .values({
        ownerId: userId,
        name: `Demo Base ${new Date().toLocaleString()}`
      })
      .returning({ id: bases.id });

    if (!base) {
      throw new Error("Failed to create base")
    }

    const baseId = base.id;

    // 2) create table
    const [table] = await db
      .insert(tables)
      .values({
        baseId,
        name: "Demo Table",
        orderIndex: 0
      })
      .returning({ id: tables.id });

    if (!table) {
      throw new Error("Failed to create table")
    }

    const tableId = table.id;

    // 3) create some columns
    const insertedColumns = await db
      .insert(columns)
      .values([
        {
          tableId,
          name: "Name",
          type: "text" as const,
          orderIndex: 0
        },
        {
          tableId,
          name: "Email",
          type: "text" as const,
          orderIndex: 1
        },
        {
          tableId,
          name: "Age",
          type: "number" as const,
          orderIndex: 2
        }
      ])
      .returning({
        id: columns.id,
        name: columns.name
      });

    const nameColId = insertedColumns.find(c => c.name === "Name")!.id;
    const emailColId = insertedColumns.find(c => c.name === "Email")!.id;
    const ageColId = insertedColumns.find(c => c.name === "Age")!.id;

    // 4) create 1000 rows of fake data
    const ROW_COUNT = 1000;

    const rowsToInsert = Array.from({ length: ROW_COUNT }).map((_, i) => ({
      tableId,
      index: i,
      values: {
        [nameColId]: faker.person.fullName(),
        [emailColId]: faker.internet.email(),
        [ageColId]: faker.number.int({ min: 18, max: 65 })
      }
    }));

    await db.insert(rows).values(rowsToInsert);

    return { baseId, tableId };
  })
  
});
