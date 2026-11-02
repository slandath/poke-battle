import { migrate } from "drizzle-orm/node-postgres/migrator";

import { useDb } from "../utils/db";
import { httpStatus } from "../utils/http-error";

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

  try {
    await migrate(db, { migrationsFolder: `${process.cwd()}/server/database/migrations` });
    console.info("[db] migrations up to date");
  } catch (err: unknown) {
    console.error("[db] migration failed", err);
    throw err;
  }
});
