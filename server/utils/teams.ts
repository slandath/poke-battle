import { and, eq } from "drizzle-orm";

import { team } from "../database/schema";
import { useDb } from "./db";

type Database = ReturnType<typeof useDb>;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type DbOrTx = Database | Transaction;

async function findActive(dbOrTx: DbOrTx, userId: string, version: string) {
  const rows = await dbOrTx
    .select()
    .from(team)
    .where(and(eq(team.userId, userId), eq(team.version, version), eq(team.status, "active")));
  return rows[0];
}

/**
 * Get-or-create the active roster for (userId, version).
 * Uses insert + unique-violation fallback instead of onConflictDoNothing
 * because the active-team uniqueness is a partial unique index
 * (WHERE status = 'active') that Drizzle cannot express as a conflict target.
 */
export async function getOrCreateActiveTeam(dbOrTx: DbOrTx, userId: string, version: string) {
  const existing = await findActive(dbOrTx, userId, version);
  if (existing) return existing;

  try {
    const inserted = await dbOrTx
      .insert(team)
      .values({ userId, version, status: "active" })
      .returning();
    const created = inserted[0];
    if (created) return created;
    throw new Error("Failed to create team");
  } catch (err: any) {
    if (err?.code === "23505") {
      const raced = await findActive(dbOrTx, userId, version);
      if (raced) return raced;
    }
    throw err;
  }
}

export async function findActiveTeam(dbOrTx: DbOrTx, userId: string, version: string) {
  return findActive(dbOrTx, userId, version);
}
