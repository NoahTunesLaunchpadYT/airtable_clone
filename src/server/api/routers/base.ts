import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { workspaces, bases, tables, columns } from "~/server/db/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomPastelHex } from "~/server/utils/colors"

export const baseRouter = createTRPCRouter({
  // When loading the workspace page
  getBases: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const result = await db
      .select({
        id: bases.id,
        name: bases.name,
        starred: bases.starred,
        lastModifiedAt: bases.lastModifiedAt,
        workspaceId: bases.workspaceId,
        workspaceName: workspaces.name,
        color: bases.color,
        lastOpenedAt: bases.lastOpenedAt
      })
      .from(bases)
      .innerJoin(workspaces, eq(bases.workspaceId, workspaces.id))
      .where(and(eq(bases.ownerId, userId), eq(workspaces.ownerId, userId)))
      .orderBy(desc(bases.lastModifiedAt));

    return result;
  }),

  getBaseById: protectedProcedure
    .input(z.object({ baseId: z.string().uuid() }))
    .output(z.object({ id: z.string().uuid(), name: z.string(), color: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const [base] = await db
        .select({ id: bases.id, name: bases.name, color: bases.color })
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.ownerId, userId)))
        .limit(1)
      if (!base) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Base not found" })
      }

      return base
    }),

  // When user clicks on a base to open it
  getTablesForBase: protectedProcedure
    .input(z.object({ baseId: z.string().uuid() }))
    .output(z.array(z.object({ id: z.string().uuid(), name: z.string() })))
    .query(async ({ input }) => {
      const result = await db
        .select({ id: tables.id, name: tables.name }) // select only what you need
        .from(tables)
        .where(eq(tables.baseId, input.baseId))
        .orderBy(tables.orderIndex)

      return result
    }),

  // When user clicks the star icon on a base
  toggleStarred: protectedProcedure
  .input(z.object({ baseId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id;

    const [base] = await db
      .select({ starred: bases.starred })
      .from(bases)
      .where(and(eq(bases.id, input.baseId), eq(bases.ownerId, userId)));

    if (!base) throw new TRPCError({ code: "NOT_FOUND", message: "Base not found" });

    const [updated] = await db
      .update(bases)
      .set({
        starred: !base.starred,
        lastModifiedAt: new Date(),
      })
      .where(and(eq(bases.id, input.baseId), eq(bases.ownerId, userId)))
      .returning({ id: bases.id, starred: bases.starred, lastModifiedAt: bases.lastModifiedAt });

    return updated!;
  }),

  markOpened: protectedProcedure
  .input(z.object({ baseId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const updated = await ctx.db
      .update(bases)
      .set({ lastOpenedAt: sql`now()` })
      .where(and(eq(bases.id, input.baseId), eq(bases.ownerId, ctx.session.user.id)))
      .returning({ id: bases.id })

    if (updated.length === 0) {
      throw new TRPCError({ code: "NOT_FOUND" })
    }

    return { ok: true }
  }),

  // base router: in your create base mutation
  createBase: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid().optional(),
        name: z.string().min(1).max(120).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      let workspaceId = input.workspaceId

      if (workspaceId) {
        const [ws] = await db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, userId)))

        if (!ws) throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found" })
      } else {
        const [ws] = await db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.ownerId, userId))
          .orderBy(desc(workspaces.createdAt))
          .limit(1)

        if (ws) {
          workspaceId = ws.id
        } else {
          const [createdWs] = await db
            .insert(workspaces)
            .values({ ownerId: userId, name: "My First Workspace" })
            .returning({ id: workspaces.id })

          workspaceId = createdWs!.id
        }
      }

      // Create base + its first table (+ optional default columns) so /[baseId] can redirect
      const created = await db.transaction(async (tx) => {
        const [base] = await tx
          .insert(bases)
          .values({
            ownerId: userId,
            workspaceId,
            name: input.name ?? "Untitled Base",
            starred: false,
            color: randomPastelHex(),
            lastOpenedAt: sql`now()`,
          })
          .returning({ id: bases.id, workspaceId: bases.workspaceId })

        const [table] = await tx
          .insert(tables)
          .values({
            baseId: base!.id,
            name: "Table 1",
            orderIndex: 0,
          })
          .returning({ id: tables.id })

        // Optional but nice: default columns so the table isn't empty
        await tx.insert(columns).values([
          { tableId: table!.id, name: "Name", type: "text", orderIndex: 0 },
          { tableId: table!.id, name: "Notes", type: "text", orderIndex: 1 },
        ])

        return { baseId: base!.id }
      })

      return created
    }),

  deleteBase: protectedProcedure
    .input(z.object({ baseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // ensure the base exists + is owned by this user
      const [existing] = await db
        .select({ id: bases.id })
        .from(bases)
        .where(and(eq(bases.id, input.baseId), eq(bases.ownerId, userId)))
        .limit(1)

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Base not found" })
      }

      // If your FK relations are set to onDelete: "cascade", this single delete is enough.
      // Otherwise, delete children here (tables/columns/rows) before deleting the base.
      await db.delete(bases).where(and(eq(bases.id, input.baseId), eq(bases.ownerId, userId)))

      return { ok: true }
    }),
});