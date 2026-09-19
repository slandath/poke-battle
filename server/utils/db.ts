import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let cachedDb: ReturnType<typeof drizzle> | null = null;

function sslFor(connectionString: string): false | { rejectUnauthorized: boolean } {
  try {
    const host = new URL(connectionString).hostname;
    if (host.endsWith(".railway.internal") || host === "localhost" || host === "127.0.0.1") {
      return false;
    }
  } catch {
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: false };
}

export function useDb() {
  if (cachedDb) return cachedDb;

  const config = useRuntimeConfig() as { databaseUrl?: string };
  const connectionString =
    config.databaseUrl || process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || "";

  if (!connectionString) {
    throw createError({ statusCode: 503, message: "Database unavailable" });
  }

  const pool = new Pool({
    connectionString,
    ssl: sslFor(connectionString),
  });

  cachedDb = drizzle(pool);
  return cachedDb;
}
