import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { workspaces, bases, tables } from "~/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

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
      })
      .from(bases)
      .innerJoin(workspaces, eq(bases.workspaceId, workspaces.id))
      .where(and(eq(bases.ownerId, userId), eq(workspaces.ownerId, userId)))
      .orderBy(desc(bases.lastModifiedAt));

    return result;
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
});