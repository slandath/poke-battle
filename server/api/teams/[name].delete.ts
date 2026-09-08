import { and, eq } from "drizzle-orm";

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

  const name = getRouterParam(event, "name");
  if (!name) throw createError({ statusCode: 400, message: "Missing name" });

  const db = useDb();

  const userTeam = await db
    .select()
    .from(team)
    .where(eq(team.userId, session.user.id))
    .then((r: any) => r[0]);

  if (!userTeam) return { success: true };

  await db
    .delete(teamPokemon)
    .where(and(eq(teamPokemon.teamId, userTeam.id), eq(teamPokemon.name, name)));

  const remaining = await db.select().from(teamPokemon).where(eq(teamPokemon.teamId, userTeam.id));

  return remaining.map((p: any) => ({
    name: p.name,
    types: p.types,
    sprites: p.sprites ?? undefined,
    damageRelations: p.damageRelations ?? undefined,
  }));
});
