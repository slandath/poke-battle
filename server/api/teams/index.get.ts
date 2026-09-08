import { eq } from "drizzle-orm";

import { team, teamPokemon } from "../../database/schema";
import { getAuth } from "../../utils/auth";
import { useDb } from "../../utils/db";

export default defineEventHandler(async (event) => {
  const auth = getAuth();
  if (!auth) throw createError({ statusCode: 500, message: "Auth not initialized" });
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session?.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  const db = useDb();

  // ensure team exists for user (single team per user, minimal)
  let userTeam = await db
    .select()
    .from(team)
    .where(eq(team.userId, session.user.id))
    .then((r: any) => r[0]);

  if (!userTeam) {
    const inserted = await db.insert(team).values({ userId: session.user.id }).returning();
    userTeam = inserted[0];
  }

  if (!userTeam) return [];

  const pokemons = await db.select().from(teamPokemon).where(eq(teamPokemon.teamId, userTeam.id));

  return pokemons.map((p: any) => ({
    name: p.name,
    types: p.types,
    sprites: p.sprites ?? undefined,
    damageRelations: p.damageRelations ?? undefined,
  }));
});
