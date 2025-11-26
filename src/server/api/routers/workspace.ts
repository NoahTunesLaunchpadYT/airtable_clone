// src/server/api/routers/workspace.ts
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "~/server/db";
import { workspaces } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const workspaceRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(workspaces).where(eq(workspaces.ownerId, ctx.session.user.id));
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [ws] = await db
        .insert(workspaces)
        .values({ ownerId: ctx.session.user.id, name: input.name })
        .returning();
      return ws!;
    }),
});
