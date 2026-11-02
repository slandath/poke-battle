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
 * Uses a single atomic INSERT ... ON CONFLICT DO NOTHING (no conflict target,
 * so it covers the partial unique index) then re-reads. This is safe to call
 * inside a transaction, unlike catching a unique violation: a failed statement
 * aborts the Postgres transaction, so a fallback re-read could never run.
 */
export async function getOrCreateActiveTeam(dbOrTx: DbOrTx, userId: string, version: string) {
  const existing = await findActive(dbOrTx, userId, version);
  if (existing) return existing;

  await dbOrTx.insert(team).values({ userId, version, status: "active" }).onConflictDoNothing();
  const created = await findActive(dbOrTx, userId, version);
  if (!created) throw new Error("Failed to create team");
  return created;
}

export async function findActiveTeam(dbOrTx: DbOrTx, userId: string, version: string) {
  return findActive(dbOrTx, userId, version);
}
