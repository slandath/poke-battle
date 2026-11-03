import { fileURLToPath } from "node:url";

import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

const migrationsFolder = fileURLToPath(new URL("../../database/migrations", import.meta.url));

/**
 * In-memory Postgres with the real migration chain applied, so partial indexes
 * (e.g. `team_user_version_active_unique`) behave exactly as in production.
 */
export async function createTestDatabase() {
  const client = new PGlite();
  try {
    const db = drizzle(client);
    await migrate(db, { migrationsFolder });
    return { db, client };
  } catch (error) {
    await client.close();
    throw error;
  }
}

export type TestDb = Awaited<ReturnType<typeof createTestDatabase>>["db"];
