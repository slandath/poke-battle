import { eq } from "drizzle-orm";

import { teamPokemon } from "../../database/schema";
import { requireSession } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { rethrowHttpOrUnavailable } from "../../utils/http-error";
import { getOrCreateActiveTeam } from "../../utils/teams";
import { normalizeVersion } from "../../utils/versions";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);

  const version = normalizeVersion(getQuery(event).version);
  if (!version) {
    throw createError({ statusCode: 400, message: "Missing or invalid version" });
  }

  try {
    const db = useDb();

    const userTeam = await getOrCreateActiveTeam(db, session.user.id, version);
    if (!userTeam) return [];

    const pokemons = await db.select().from(teamPokemon).where(eq(teamPokemon.teamId, userTeam.id));

    return pokemons.map((p: any) => ({
      name: p.name,
      types: p.types,
      sprites: p.sprites ?? undefined,
      damageRelations: p.damageRelations ?? undefined,
    }));
  } catch (err: unknown) {
    return rethrowHttpOrUnavailable(err);
  }
});
