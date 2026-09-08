import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function useDb() {
  if (cachedDb) return cachedDb;

  const config = useRuntimeConfig() as { databaseUrl?: string };
  const connectionString = config.databaseUrl;

  // During lint/typecheck with dummy URL, allow missing DB – throw only at runtime
  if (!connectionString) {
    // Create a dummy pool that will error if actually queried without env
    const dummyPool = new Pool({
      connectionString: "postgresql://dummy:dummy@localhost:5432/dummy",
    });
    cachedDb = drizzle(dummyPool);
    return cachedDb;
  }

  const pool = new Pool({
    connectionString,
    // Railway private network: no SSL
    ssl: false,
  });

  cachedDb = drizzle(pool);
  return cachedDb;
}
