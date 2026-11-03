import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { useDb } from "../utils/db";
import { httpStatus } from "../utils/http-error";

/**
 * `pg_advisory_lock` key. Session-scoped, so the lock is held on the dedicated
 * connection below for the whole migration run. Value is `"POKE"` in ASCII.
 */
export const MIGRATION_LOCK_KEY = 0x504f4b45;

/**
 * Nitro bundles `server/database/migrations` as server assets (`assets:migrations`
 * in `nuxt.config.ts`), so the SQL ships inside `.output` instead of relying on
 * a source folder next to `process.cwd()`. Drizzle's migrator only accepts a
 * filesystem folder, so the bundled files are written to a temp directory that
 * the caller removes afterwards.
 */
async function materializeMigrations(): Promise<string> {
  const storage = useStorage("assets:migrations");
  const keys = await storage.getKeys();

  if (keys.length === 0) {
    throw new Error("No migrations found in the bundled assets:migrations storage");
  }

  const folder = await mkdtemp(join(tmpdir(), "poke-migrations-"));

  for (const key of keys) {
    const contents = await storage.getItemRaw(key);
    if (typeof contents !== "string") continue;

    // Storage keys use `:` as the path separator (e.g. `meta:_journal.json`).
    const target = join(folder, key.replaceAll(":", "/"));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents);
  }

  return folder;
}

/**
 * Apply pending Drizzle migrations on boot so deploys never serve code
 * against an outdated schema. `migrate()` is idempotent: already-applied
 * entries in `__drizzle_migrations` are skipped.
 */
export default defineNitroPlugin(async () => {
  let db: ReturnType<typeof useDb>;
  try {
    db = useDb();
  } catch (err: unknown) {
    if (httpStatus(err) === 503) {
      console.warn("[db] skipping migrations: no database configured");
      return;
    }
    throw err;
  }

  // One connection for the lock and the migration run: `pg_advisory_lock` is
  // session-scoped, so a pooled migrator could migrate on a different session.
  // Holding the lock also serializes concurrent instances booting together,
  // which would otherwise race on DDL without `IF NOT EXISTS`.
  const client = await db.$client.connect();
  let migrationsFolder: string | undefined;

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    migrationsFolder = await materializeMigrations();
    await migrate(drizzle(client), { migrationsFolder });
    console.info("[db] migrations up to date");
  } catch (err: unknown) {
    console.error("[db] migration failed", err);
    throw err;
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
    } catch (err: unknown) {
      console.error("[db] failed to release the migration lock", err);
    }

    client.release();

    if (migrationsFolder) {
      await rm(migrationsFolder, { recursive: true, force: true });
    }
  }
});
