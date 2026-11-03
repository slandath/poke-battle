import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import deleteHallOfFame from "~~/server/api/hall-of-fame/[id].delete";
import getHallOfFame from "~~/server/api/hall-of-fame/index.get";
import deleteTeamPokemon from "~~/server/api/teams/[name].delete";
import enshrineTeam from "~~/server/api/teams/enshrine.post";
import getTeam from "~~/server/api/teams/index.get";
import addTeamPokemon from "~~/server/api/teams/index.post";
import { team, teamPokemon, user } from "~~/server/database/schema";

import { createTestDatabase } from "./helpers/db";
import type { TestDb } from "./helpers/db";
import { setRequest } from "./helpers/setup";
import type { RequestFixture } from "./helpers/setup";
import { OTHER_USER, PRIMARY_USER, dbRef, sessionRef, stubEvent } from "./helpers/state";

vi.mock("~~/server/utils/db", () => ({ useDb: () => dbRef.current }));
vi.mock("~~/server/utils/auth", () => ({
  requireSession: async () => {
    if (!sessionRef.current) {
      throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
    }
    return sessionRef.current;
  },
}));

interface HallOfFameResponse {
  id: number;
  version: string;
  title?: string;
  notes?: string;
  enshrinedAt?: string;
  pokemon: Array<{ name: string; types: string[] }>;
}

interface EnshrineResponse {
  success: boolean;
  title: string;
  enshrinedId: number;
}

interface AddResponse {
  success: boolean;
  title: string;
  pokemon: { name: string };
}

let db: TestDb;
let closeDb: (() => Promise<void>) | undefined;

async function callApi<T>(
  handler: (event: never) => Promise<unknown>,
  fixture: RequestFixture = {},
): Promise<T> {
  setRequest(fixture);
  // h3 erases handler response types; each test declares the shape it asserts on.
  return (await handler(stubEvent())) as T;
}

const getActiveTeam = (version: string) =>
  callApi<Array<{ name: string }>>(getTeam, { query: { version } });

const addMon = (version: string, name: string) =>
  callApi<AddResponse>(addTeamPokemon, {
    body: { version, pokemon: { name, types: ["Normal"] } },
  });

const deleteMon = (version: string, name: string) =>
  callApi<Array<{ name: string }>>(deleteTeamPokemon, {
    params: { name },
    query: { version },
  });

const enshrine = (version: string, title?: string, notes?: string) =>
  callApi<EnshrineResponse>(enshrineTeam, { body: { version, title, notes } });

const getMemorials = (version?: string) =>
  callApi<HallOfFameResponse[]>(getHallOfFame, { query: version === undefined ? {} : { version } });

const deleteMemorial = (id: string | number) =>
  callApi<{ success: boolean }>(deleteHallOfFame, { params: { id: String(id) } });

async function seedTeam(version: string, names: string[]) {
  for (const name of names) {
    await addMon(version, name);
  }
}

async function activeRows(version: string) {
  return db.select().from(team).where(eq(team.version, version));
}

beforeAll(async () => {
  const created = await createTestDatabase();
  db = created.db;
  closeDb = () => created.client.close();
  dbRef.current = db;
});

afterAll(async () => {
  dbRef.current = undefined;
  // Only assigned once `beforeAll` resolves; on a failed migration this is
  // undefined and must not mask the migration error with a TypeError.
  await closeDb?.();
});

beforeEach(async () => {
  sessionRef.current = PRIMARY_USER;
  await db.execute(sql`TRUNCATE TABLE team_pokemon, team, "user" RESTART IDENTITY CASCADE`);
  for (const session of [PRIMARY_USER, OTHER_USER]) {
    await db.insert(user).values(session.user);
  }
});

describe("GET /api/teams", () => {
  it("rejects a missing version", async () => {
    await expect(callApi(getTeam, {})).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing or invalid version",
    });
  });

  it("rejects an unknown version", async () => {
    await expect(getActiveTeam("not-a-game")).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing or invalid version",
    });
  });

  it("returns an empty roster and creates the active team", async () => {
    await expect(getActiveTeam("red")).resolves.toEqual([]);
    expect(await activeRows("red")).toHaveLength(1);
    expect((await activeRows("red"))[0]?.status).toBe("active");
  });

  it("reuses the active team on subsequent calls", async () => {
    await getActiveTeam("red");
    await getActiveTeam("red");

    expect(await activeRows("red")).toHaveLength(1);
  });

  it("rejects unauthenticated requests", async () => {
    sessionRef.current = null;

    await expect(getActiveTeam("red")).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("POST /api/teams", () => {
  it("accepts six Pokemon and rejects the seventh", async () => {
    for (const name of ["One", "Two", "Three", "Four", "Five", "Six"]) {
      await expect(addMon("red", name)).resolves.toMatchObject({ success: true });
    }

    await expect(addMon("red", "Seven")).rejects.toMatchObject({
      statusCode: 400,
      message: "Team is full",
    });
  });

  it("rejects a duplicate name", async () => {
    await addMon("red", "Pikachu");

    await expect(addMon("red", "Pikachu")).rejects.toMatchObject({
      statusCode: 400,
      message: "Already on team!",
    });
  });

  it("keeps rosters isolated per version", async () => {
    await addMon("scarlet", "Pikachu");

    await expect(getActiveTeam("red")).resolves.toEqual([]);
    await expect(getActiveTeam("scarlet")).resolves.toHaveLength(1);
  });

  it("keeps rosters isolated per user", async () => {
    await seedTeam("red", ["Pikachu"]);

    sessionRef.current = OTHER_USER;
    await expect(getActiveTeam("red")).resolves.toEqual([]);
    await expect(deleteMon("red", "Pikachu")).resolves.toEqual([]);

    sessionRef.current = PRIMARY_USER;
    await expect(getActiveTeam("red")).resolves.toEqual([
      expect.objectContaining({ name: "Pikachu" }),
    ]);
  });

  it("rejects an invalid pokemon payload", async () => {
    await expect(
      callApi(addTeamPokemon, { body: { version: "red", pokemon: { name: "" } } }),
    ).rejects.toMatchObject({ statusCode: 400, message: "Invalid pokemon payload" });
  });

  it("never accepts more than six members under concurrent adds", async () => {
    await seedTeam("red", ["One", "Two", "Three", "Four", "Five"]);

    // PGlite serializes transactions on its single connection, so this cannot
    // reproduce the read-committed interleaving that the team-row lock guards
    // against on a real pool. It still pins the observable invariant: whatever
    // the scheduling, the roster never exceeds six.
    await Promise.allSettled([
      addMon("red", "Six"),
      addMon("red", "Seven"),
      addMon("red", "Eight"),
    ]);

    const roster = await getActiveTeam("red");
    expect(roster.length).toBeLessThanOrEqual(6);
  });
});

describe("DELETE /api/teams/:name", () => {
  it("removes a Pokemon and returns the remaining roster", async () => {
    await seedTeam("red", ["Pikachu", "Charizard"]);

    await expect(deleteMon("red", "Charizard")).resolves.toEqual([
      expect.objectContaining({ name: "Pikachu" }),
    ]);
  });

  it("leaves the roster untouched for an unknown name", async () => {
    await seedTeam("red", ["Pikachu"]);

    await expect(deleteMon("red", "Mewtwo")).resolves.toEqual([
      expect.objectContaining({ name: "Pikachu" }),
    ]);
  });

  it("returns an empty list when no active team exists", async () => {
    await expect(deleteMon("blue", "Pikachu")).resolves.toEqual([]);
    expect(await activeRows("blue")).toHaveLength(0);
  });

  it("rejects an invalid version", async () => {
    await expect(deleteMon("nope", "Pikachu")).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing or invalid version",
    });
  });
});

describe("POST /api/teams/enshrine", () => {
  it("rejects an empty roster", async () => {
    await expect(enshrine("red")).rejects.toMatchObject({
      statusCode: 400,
      message: "Team is empty",
    });
  });

  it("enshrines the roster and starts a fresh active team", async () => {
    await seedTeam("red", ["Pikachu", "Charizard"]);

    const result = await enshrine("red", "Champion run", "No items");

    expect(result).toMatchObject({ success: true, title: "Enshrined!" });

    const rows = await activeRows("red");
    expect(rows).toHaveLength(2);

    const memorial = rows.find((row) => row.status === "enshrined");
    const active = rows.find((row) => row.status === "active");

    expect(memorial).toMatchObject({
      id: result.enshrinedId,
      title: "Champion run",
      notes: "No items",
    });
    expect(memorial?.enshrinedAt).toBeInstanceOf(Date);
    expect(active).toBeDefined();

    const members = await db
      .select()
      .from(teamPokemon)
      .where(eq(teamPokemon.teamId, result.enshrinedId));
    expect(members.map((member) => member.name)).toEqual(["Pikachu", "Charizard"]);

    await expect(getActiveTeam("red")).resolves.toEqual([]);
  });

  it("only resets the active team of the enshrined version", async () => {
    await seedTeam("red", ["Pikachu"]);
    await seedTeam("scarlet", ["Charizard"]);

    await enshrine("scarlet");

    await expect(getActiveTeam("red")).resolves.toHaveLength(1);
    await expect(getActiveTeam("scarlet")).resolves.toEqual([]);
  });

  it("rejects an invalid version", async () => {
    await expect(enshrine("nope")).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing or invalid version",
    });
  });
});

describe("GET /api/hall-of-fame", () => {
  it("returns memorials newest first", async () => {
    await seedTeam("red", ["Pikachu"]);
    const first = await enshrine("red", "First created");
    await seedTeam("red", ["Charizard"]);
    const second = await enshrine("red", "Second created");

    // Swap the timestamps relative to the ids: ordering by id descending would
    // now produce the opposite result, so this test really pins enshrinedAt.
    await db
      .update(team)
      .set({ enshrinedAt: new Date("2024-06-01") })
      .where(eq(team.id, first.enshrinedId));
    await db
      .update(team)
      .set({ enshrinedAt: new Date("2024-01-01") })
      .where(eq(team.id, second.enshrinedId));

    const memorials = await getMemorials();

    expect(memorials.map((memorial) => memorial.title)).toEqual([
      "First created",
      "Second created",
    ]);
    expect(memorials[0]?.pokemon.map((pokemon) => pokemon.name)).toEqual(["Pikachu"]);
  });

  it("treats `all` and a missing filter the same", async () => {
    await seedTeam("red", ["Pikachu"]);
    await enshrine("red");

    await expect(getMemorials("all")).resolves.toHaveLength(1);
    await expect(getMemorials()).resolves.toHaveLength(1);
  });

  it("returns memorials from every version for `all`", async () => {
    await seedTeam("red", ["Pikachu"]);
    await enshrine("red");
    await seedTeam("scarlet", ["Charizard"]);
    await enshrine("scarlet");

    const memorials = await getMemorials("all");

    expect(memorials.map((memorial) => memorial.version).toSorted()).toEqual(["red", "scarlet"]);
  });

  it("scopes memorials by version", async () => {
    await seedTeam("red", ["Pikachu"]);
    await enshrine("red");
    await seedTeam("scarlet", ["Charizard"]);
    await enshrine("scarlet");

    const scarlet = await getMemorials("scarlet");

    expect(scarlet).toHaveLength(1);
    expect(scarlet[0]).toMatchObject({ version: "scarlet" });
  });

  it("rejects an invalid version filter", async () => {
    await expect(getMemorials("nope")).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing or invalid version",
    });
  });

  it("never returns another user's memorials", async () => {
    await seedTeam("red", ["Pikachu"]);
    await enshrine("red");

    sessionRef.current = OTHER_USER;

    await expect(getMemorials("all")).resolves.toEqual([]);
  });
});

describe("DELETE /api/hall-of-fame/:id", () => {
  it("deletes an owned memorial and its Pokemon", async () => {
    await seedTeam("red", ["Pikachu"]);
    const { enshrinedId } = await enshrine("red");

    await expect(deleteMemorial(enshrinedId)).resolves.toMatchObject({ success: true });

    expect(await db.select().from(team).where(eq(team.id, enshrinedId))).toEqual([]);
    expect(await db.select().from(teamPokemon).where(eq(teamPokemon.teamId, enshrinedId))).toEqual(
      [],
    );
  });

  it("404s for another user's memorial", async () => {
    await seedTeam("red", ["Pikachu"]);
    const { enshrinedId } = await enshrine("red");

    sessionRef.current = OTHER_USER;

    await expect(deleteMemorial(enshrinedId)).rejects.toMatchObject({
      statusCode: 404,
      message: "Memorial not found",
    });
  });

  it("404s when the id belongs to an active team", async () => {
    await getActiveTeam("red");
    const [active] = await activeRows("red");

    await expect(deleteMemorial(active!.id)).rejects.toMatchObject({
      statusCode: 404,
      message: "Memorial not found",
    });
  });

  it("rejects a non-numeric id", async () => {
    await expect(deleteMemorial("abc")).rejects.toMatchObject({
      statusCode: 400,
      message: "Missing or invalid id",
    });
  });
});
