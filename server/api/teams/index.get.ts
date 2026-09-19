import { eq } from "drizzle-orm";

import { team, teamPokemon } from "../../database/schema";
import { requireSession } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { rethrowHttpOrUnavailable } from "../../utils/http-error";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);

  try {
    const db = useDb();

    let userTeam = await db
      .select()
      .from(team)
      .where(eq(team.userId, session.user.id))
      .then((r: any) => r[0]);

    if (!userTeam) {
      const inserted = await db
        .insert(team)
        .values({ userId: session.user.id })
        .onConflictDoNothing({ target: team.userId })
        .returning();
      const insertedTeam = (inserted as any)[0] as typeof userTeam | undefined;
      userTeam =
        insertedTeam ??
        (await db
          .select()
          .from(team)
          .where(eq(team.userId, session.user.id))
          .then((r: any) => r[0]));
    }

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
