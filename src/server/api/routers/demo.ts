// src/server/api/routers/demo.ts
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { workspaces, bases, tables, columns, rows } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import { faker } from "@faker-js/faker";
import { createIndexesForColumn } from "~/server/db/columnIndexes";
import { getTableName } from "drizzle-orm";
import { randomPastelHex } from "~/server/utils/colors"

export const demoRouter = createTRPCRouter({
  createDemoData: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // 1) all writes in ONE transaction
    const txResult = await db.transaction(async (tx) => {
      await tx.delete(workspaces).where(eq(workspaces.ownerId, userId));

      const now = Date.now()
      const ago = (ms: number) => new Date(now - ms)

      const [wsDemo, wsPersonal, wsTeam, wsEmpty] = await tx
        .insert(workspaces)
        .values([
          { ownerId: userId, name: "Demo Workspace" },
          { ownerId: userId, name: "Personal" },
          { ownerId: userId, name: "Team Workspace" },
          { ownerId: userId, name: "Empty Workspace" },
        ])
        .returning({ id: workspaces.id, name: workspaces.name })

      if (!wsDemo || !wsPersonal || !wsTeam || !wsEmpty) throw new Error("Failed to create workspaces")

      const insertedBases = await tx
        .insert(bases)
        .values([
          // Keep your two “main” bases (used below for tables/rows)
          {
            ownerId: userId,
            workspaceId: wsDemo.id,
            name: "Starred Base",
            starred: true,
            color: randomPastelHex(),
            lastOpenedAt: ago(60 * 60 * 1000), // 1 hour ago
          },
          {
            ownerId: userId,
            workspaceId: wsDemo.id,
            name: "Empty Base",
            starred: false,
            color: randomPastelHex(),
            lastOpenedAt: ago(3 * 24 * 60 * 60 * 1000), // 3 days ago
          },

          // Extra bases to exercise Today / Past 7 / Past 30 / Past year / Earlier
          {
            ownerId: userId,
            workspaceId: wsPersonal.id,
            name: "Groceries & Meals",
            starred: false,
            color: randomPastelHex(),
            lastOpenedAt: ago(20 * 1000), // 20 seconds ago (Today)
          },
          {
            ownerId: userId,
            workspaceId: wsPersonal.id,
            name: "Uni Planner",
            starred: true,
            color: randomPastelHex(),
            lastOpenedAt: ago(2 * 60 * 60 * 1000), // 2 hours ago (Today)
          },
          {
            ownerId: userId,
            workspaceId: wsTeam.id,
            name: "Hiring Pipeline",
            starred: false,
            color: randomPastelHex(),
            lastOpenedAt: ago(6 * 24 * 60 * 60 * 1000), // 6 days ago (Past 7)
          },
          {
            ownerId: userId,
            workspaceId: wsTeam.id,
            name: "Sprint Board",
            starred: true,
            color: randomPastelHex(),
            lastOpenedAt: ago(12 * 24 * 60 * 60 * 1000), // 12 days ago (Past 30)
          },
          {
            ownerId: userId,
            workspaceId: wsDemo.id,
            name: "Marketing Calendar",
            starred: false,
            color: randomPastelHex(),
            lastOpenedAt: ago(28 * 24 * 60 * 60 * 1000), // 28 days ago (Past 30)
          },
          {
            ownerId: userId,
            workspaceId: wsDemo.id,
            name: "Budget 2025",
            starred: false,
            color: randomPastelHex(),
            lastOpenedAt: ago(120 * 24 * 60 * 60 * 1000), // ~4 months (Past year)
          },
          {
            ownerId: userId,
            workspaceId: wsDemo.id,
            name: "Archive (Old)",
            starred: false,
            color: randomPastelHex(),
            lastOpenedAt: ago(420 * 24 * 60 * 60 * 1000), // ~14 months (Earlier)
          },
        ])
        .returning({
          id: bases.id,
          name: bases.name,
          color: bases.color,
          lastOpenedAt: bases.lastOpenedAt,
        })

      const baseStarred = insertedBases.find(b => b.name === "Starred Base")
      const baseEmpty = insertedBases.find(b => b.name === "Empty Base")
      if (!baseStarred || !baseEmpty) throw new Error("Failed to create bases");

      const [tableBig, tableSmall] = await tx
        .insert(tables)
        .values([
          { baseId: baseStarred.id, name: "Big Table (100k)", orderIndex: 0 },
          { baseId: baseStarred.id, name: "Small Table (1k)", orderIndex: 1 },
        ])
        .returning({ id: tables.id, name: tables.name });

      if (!tableBig || !tableSmall) throw new Error("Failed to create tables");

      async function createDefaultColumns(tableId: string) {
        const inserted = await tx
          .insert(columns)
          .values([
            { tableId, name: "Name", type: "text", orderIndex: 0 },
            { tableId, name: "Email", type: "text", orderIndex: 1 },
            { tableId, name: "Age", type: "number", orderIndex: 2 },
          ])
          .returning({ id: columns.id, tableId: columns.tableId, type: columns.type, name: columns.name });

        const nameColId = inserted.find((c) => c.name === "Name")!.id;
        const emailColId = inserted.find((c) => c.name === "Email")!.id;
        const ageColId = inserted.find((c) => c.name === "Age")!.id;

        return { insertedColumns: inserted, nameColId, emailColId, ageColId };
      }

      const bigCols = await createDefaultColumns(tableBig.id);
      const smallCols = await createDefaultColumns(tableSmall.id);

      async function seedRows(args: {
        tableId: string;
        rowCount: number;
        batchSize: number;
        colIds: { nameColId: string; emailColId: string; ageColId: string };
        label: string;
      }) {
        const { tableId, rowCount, batchSize, colIds, label } = args;
        const batches = Math.ceil(rowCount / batchSize);

        for (let b = 0; b < batches; b++) {
          const start = b * batchSize;
          const end = Math.min(start + batchSize, rowCount);

          const batch: (typeof rows.$inferInsert)[] = [];
          for (let i = start; i < end; i++) {
            batch.push({
              tableId,
              index: i,
              values: {
                [colIds.nameColId]: faker.person.fullName(),
                [colIds.emailColId]: faker.internet.email(),
                [colIds.ageColId]: faker.number.int({ min: 18, max: 65 }),
              },
            });
          }

          await tx.insert(rows).values(batch);
          if ((b + 1) % 20 === 0 || b + 1 === batches) {
            console.log(`[demo] ${label}: inserted batch ${b + 1}/${batches} (rows ${start}-${end - 1})`);
          }
        }
      }

      await seedRows({
        tableId: tableBig.id,
        rowCount: 100_000,
        batchSize: 1_000,
        colIds: bigCols,
        label: "Big Table (100k)",
      });

      await seedRows({
        tableId: tableSmall.id,
        rowCount: 1_000,
        batchSize: 1_000,
        colIds: smallCols,
        label: "Small Table (1k)",
      });

      const allInsertedColumns = [...bigCols.insertedColumns, ...smallCols.insertedColumns];

      return {
        workspaceIds: { demo: wsDemo.id, empty: wsDemo.id },
        baseIds: { starred: baseStarred.id, empty: baseEmpty.id },
        tableIds: { big: tableBig.id, small: tableSmall.id },
        insertedColumns: allInsertedColumns, // for indexing outside tx
      };
    });

    // 2) indexes AFTER the tx commits (no lock deadlock)
    console.log(`[demo] creating ${txResult.insertedColumns.length} column indexes...`);
    for (const c of txResult.insertedColumns) {
      await createIndexesForColumn({
        tableId: c.tableId,
        columnId: c.id,
        type: c.type,
      });
      console.log(`[demo] indexed columnId=${c.id} type=${c.type} tableId=${c.tableId}`);
    }

    // 3) analyse after big changes
    const rowsTableName = getTableName(rows);
    await db.execute(sql.raw(`ANALYZE ${rowsTableName}`));

    return {
      workspaceIds: txResult.workspaceIds,
      baseIds: txResult.baseIds,
      tableIds: txResult.tableIds,
    };
  }),
});
