// src/server/db/touchBase.ts
import { db } from "~/server/db";
import { bases } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function touchBase(baseId: string) {
  await db.update(bases).set({ lastModifiedAt: new Date() }).where(eq(bases.id, baseId));
}
