import { and, desc, eq, inArray } from "drizzle-orm";

import { team, teamPokemon } from "../../database/schema";
import { requireSession } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { rethrowHttpOrUnavailable } from "../../utils/http-error";
import { normalizeVersion } from "../../utils/versions";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);

  const rawVersion = getQuery(event).version;
  const wantAll = rawVersion === undefined || rawVersion === "all";
  const version = wantAll ? null : normalizeVersion(rawVersion);
  if (!wantAll && !version) {
    throw createError({ statusCode: 400, message: "Missing or invalid version" });
  }

  try {
    const db = useDb();

    const filters = [eq(team.userId, session.user.id), eq(team.status, "enshrined")];
    if (version) filters.push(eq(team.version, version));

    const memorials = await db
      .select()
      .from(team)
      .where(and(...filters))
      .orderBy(desc(team.enshrinedAt));

    if (memorials.length === 0) return [];

    const ids = memorials.map((t) => t.id);
    const members = await db.select().from(teamPokemon).where(inArray(teamPokemon.teamId, ids));

    const byTeam = new Map<number, typeof members>();
    for (const m of members) {
      const list = byTeam.get(m.teamId) ?? [];
      list.push(m);
      byTeam.set(m.teamId, list);
    }

    return memorials.map((t) => ({
      id: t.id,
      version: t.version,
      title: t.title ?? undefined,
      notes: t.notes ?? undefined,
      enshrinedAt: t.enshrinedAt ?? undefined,
      pokemon: (byTeam.get(t.id) ?? []).map((m) => ({
        name: m.name,
        types: m.types,
        sprites: m.sprites ?? undefined,
        damageRelations: m.damageRelations ?? undefined,
      })),
    }));
  } catch (err: unknown) {
    return rethrowHttpOrUnavailable(err);
  }
});
