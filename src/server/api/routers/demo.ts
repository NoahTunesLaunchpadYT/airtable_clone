import { createTRPCRouter, protectedProcedure } from "../trpc";
import { workspaces, bases, tables, columns, rows } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";

import { faker } from "@faker-js/faker";
import { createIndexesForColumn } from "~/server/db/columnIndexes";
import { getTableName } from "drizzle-orm"


export const demoRouter = createTRPCRouter({
  // Create demo base + table + 1000 rows
  createDemoData: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id

    return db.transaction(async (tx) => {
      // 0) delete everything for this user via workspaces cascade
      await tx.delete(workspaces).where(eq(workspaces.ownerId, userId))

      // 1) create 2 workspaces (second is empty)
      const [ws1, ws2] = await tx
        .insert(workspaces)
        .values([
          { ownerId: userId, name: "Demo Workspace" },
          { ownerId: userId, name: "Empty Workspace" },
        ])
        .returning({ id: workspaces.id, name: workspaces.name })

      if (!ws1 || !ws2) throw new Error("Failed to create workspaces")

      // 2) create 2 bases in workspace 1 (one starred, one empty)
      const [baseStarred, baseEmpty] = await tx
        .insert(bases)
        .values([
          {
            ownerId: userId,
            workspaceId: ws1.id,
            name: "Starred Base",
            starred: true,
          },
          {
            ownerId: userId,
            workspaceId: ws1.id,
            name: "Empty Base",
            starred: false,
          },
        ])
        .returning({ id: bases.id, name: bases.name })

      if (!baseStarred || !baseEmpty) throw new Error("Failed to create bases")

      // 3) create 2 tables in the starred base
      const [tableBig, tableSmall] = await tx
        .insert(tables)
        .values([
          { baseId: baseStarred.id, name: "Big Table (100k)", orderIndex: 0 },
          { baseId: baseStarred.id, name: "Small Table (1k)", orderIndex: 1 },
        ])
        .returning({ id: tables.id, name: tables.name })

      if (!tableBig || !tableSmall) throw new Error("Failed to create tables")

      // helper: create 3 columns for a table and return their ids
      async function createDefaultColumns(tableId: string) {
        const inserted = await tx
          .insert(columns)
          .values([
            { tableId, name: "Name", type: "text", orderIndex: 0 },
            { tableId, name: "Email", type: "text", orderIndex: 1 },
            { tableId, name: "Age", type: "number", orderIndex: 2 },
          ])
          .returning({
            id: columns.id,
            tableId: columns.tableId,
            name: columns.name,
            type: columns.type,
          });

        const nameColId = inserted.find((c) => c.name === "Name")!.id
        const emailColId = inserted.find((c) => c.name === "Email")!.id
        const ageColId = inserted.find((c) => c.name === "Age")!.id

        return { insertedColumns: inserted, nameColId, emailColId, ageColId }
      }

      // 4) columns for both tables
      const bigCols = await createDefaultColumns(tableBig.id)
      const smallCols = await createDefaultColumns(tableSmall.id)

      // 5) bulk insert rows for a table
      async function seedRows(args: {
        tableId: string
        rowCount: number
        batchSize: number
        colIds: { nameColId: string; emailColId: string; ageColId: string }
      }) {
        const { tableId, rowCount, batchSize, colIds } = args

        for (let start = 0; start < rowCount; start += batchSize) {
          const end = Math.min(start + batchSize, rowCount)
          const batch: (typeof rows.$inferInsert)[] = []

          for (let i = start; i < end; i++) {
            batch.push({
              tableId,
              index: i,
              values: {
                [colIds.nameColId]: faker.person.fullName(),
                [colIds.emailColId]: faker.internet.email(),
                [colIds.ageColId]: faker.number.int({ min: 18, max: 65 }),
              },
            })
          }

          await tx.insert(rows).values(batch)
        }
      }

      // Insert first, index later (faster)
      await seedRows({
        tableId: tableBig.id,
        rowCount: 100_000,
        batchSize: 1_000,
        colIds: bigCols,
      })

      await seedRows({
        tableId: tableSmall.id,
        rowCount: 1_000,
        batchSize: 1_000,
        colIds: smallCols,
      })

      // 6) create indexes AFTER data load (fastest)
      const allInsertedColumns = [...bigCols.insertedColumns, ...smallCols.insertedColumns]
      for (const c of allInsertedColumns) {
        await createIndexesForColumn({
          tableId: c.tableId,
          columnId: c.id,
          type: c.type,
        })
      }

      // 7) update planner stats (important after big inserts)
      const rowsTableName = getTableName(rows)
      await tx.execute(sql.raw(`ANALYZE ${rowsTableName}`))

      return {
        workspaceIds: { demo: ws1.id, empty: ws2.id },
        baseIds: { starred: baseStarred.id, empty: baseEmpty.id },
        tableIds: { big: tableBig.id, small: tableSmall.id },
      }
    })
  })
});