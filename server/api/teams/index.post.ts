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

  const body = await readBody<{
    pokemon: {
      name: string;
      types: string[];
      sprites?: string;
      damageRelations?: {
        doubleDamageFrom: string[];
        halfDamageFrom: string[];
        noDamageFrom: string[];
      };
    };
  }>(event);

  if (!body?.pokemon?.name || !Array.isArray(body.pokemon.types)) {
    throw createError({ statusCode: 400, message: "Invalid pokemon payload" });
  }

  const db = useDb();

  let userTeam = await db
    .select()
    .from(team)
    .where(eq(team.userId, session.user.id))
    .then((r: any) => r[0]);

  if (!userTeam) {
    const inserted = await db.insert(team).values({ userId: session.user.id }).returning();
    userTeam = inserted[0];
  }

  if (!userTeam) throw createError({ statusCode: 500, message: "Failed to create team" });

  const existing = await db.select().from(teamPokemon).where(eq(teamPokemon.teamId, userTeam.id));

  if (existing.length >= 6) {
    throw createError({ statusCode: 400, message: "Team is full" });
  }

  if (existing.some((p: any) => p.name === body.pokemon.name)) {
    throw createError({ statusCode: 400, message: "Already on team!" });
  }

  const [inserted] = await db
    .insert(teamPokemon)
    .values({
      teamId: userTeam.id,
      name: body.pokemon.name,
      types: body.pokemon.types,
      sprites: body.pokemon.sprites ?? null,
      damageRelations: body.pokemon.damageRelations ?? null,
    })
    .returning();

  return { success: true, title: "Added!", pokemon: inserted };
});
