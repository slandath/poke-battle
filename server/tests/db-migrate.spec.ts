import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~~/server/utils/db", () => ({ useDb: vi.fn() }));
vi.mock("drizzle-orm/node-postgres", () => ({ drizzle: vi.fn(() => ({})) }));
vi.mock("drizzle-orm/node-postgres/migrator", () => ({ migrate: vi.fn() }));

import { migrate } from "drizzle-orm/node-postgres/migrator";
import runMigrations from "~~/server/plugins/01.db-migrate";
import { useDb } from "~~/server/utils/db";

const useDbMock = vi.mocked(useDb);
const migrateMock = vi.mocked(migrate);

function stubMigrationStorage(files: Record<string, string>) {
  const keys = Object.keys(files);
  vi.stubGlobal("useStorage", (base?: string) => {
    if (base !== "assets:migrations") throw new Error(`unexpected storage base: ${base}`);
    return {
      getKeys: async () => keys,
      getItemRaw: async (key: string) => files[key] ?? null,
    };
  });
}

function stubClient() {
  const client = { query: vi.fn().mockResolvedValue([]), release: vi.fn() };
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("startup migration plugin", () => {
  it("skips migrations when no database is configured", async () => {
    useDbMock.mockImplementation(() => {
      throw Object.assign(new Error("Database unavailable"), { statusCode: 503 });
    });

    await expect((runMigrations as any)()).resolves.toBeUndefined();
    expect(migrateMock).not.toHaveBeenCalled();
  });

  it("runs bundled migrations under an advisory lock", async () => {
    const client = stubClient();
    useDbMock.mockReturnValue({ $client: { connect: async () => client } } as any);
    stubMigrationStorage({
      "0000_first.sql": "CREATE TABLE t (id integer);",
      "meta:_journal.json": "{}",
    });

    await (runMigrations as any)();

    expect(client.query).toHaveBeenCalledWith("SELECT pg_advisory_lock($1)", [0x504f4b45]);
    expect(migrateMock).toHaveBeenCalledTimes(1);
    expect(client.query).toHaveBeenCalledWith("SELECT pg_advisory_unlock($1)", [0x504f4b45]);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("rethrows migration failures", async () => {
    const client = stubClient();
    useDbMock.mockReturnValue({ $client: { connect: async () => client } } as any);
    stubMigrationStorage({ "0000_first.sql": "CREATE TABLE t (id integer);" });
    migrateMock.mockRejectedValueOnce(new Error("bad ddl"));

    await expect((runMigrations as any)()).rejects.toThrow("bad ddl");
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
