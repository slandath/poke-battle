import { eq } from "drizzle-orm";

import { team, teamPokemon } from "../../database/schema";
import { requireSession } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { rethrowHttpOrUnavailable } from "../../utils/http-error";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);

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

  try {
    const db = useDb();

    const result = await db.transaction(async (tx) => {
      let userTeam = await tx
        .select()
        .from(team)
        .where(eq(team.userId, session.user.id))
        .for("update")
        .then((r: any) => r[0]);

      if (!userTeam) {
        const inserted = await tx
          .insert(team)
          .values({ userId: session.user.id })
          .onConflictDoNothing({ target: team.userId })
          .returning();
        const insertedTeam = (inserted as any)[0] as typeof userTeam | undefined;
        userTeam =
          insertedTeam ??
          (await tx
            .select()
            .from(team)
            .where(eq(team.userId, session.user.id))
            .for("update")
            .then((r: any) => r[0]));
      }

      if (!userTeam) {
        return { ok: false as const, statusCode: 500, message: "Failed to create team" };
      }

      const existing = await tx
        .select()
        .from(teamPokemon)
        .where(eq(teamPokemon.teamId, userTeam.id))
        .for("update");

      if (existing.length >= 6) {
        return { ok: false as const, statusCode: 400, message: "Team is full" };
      }

      if (existing.some((p: any) => p.name === body.pokemon.name)) {
        return { ok: false as const, statusCode: 400, message: "Already on team!" };
      }

      try {
        const [inserted] = await tx
          .insert(teamPokemon)
          .values({
            teamId: userTeam.id,
            name: body.pokemon.name,
            types: body.pokemon.types,
            sprites: body.pokemon.sprites ?? null,
            damageRelations: body.pokemon.damageRelations ?? null,
          })
          .returning();
        return { ok: true as const, pokemon: inserted };
      } catch (err: any) {
        if (err?.code === "23505" || err?.message?.includes("team_pokemon_team_id_name_unique")) {
          return { ok: false as const, statusCode: 400, message: "Already on team!" };
        }
        throw err;
      }
    });

    if (!result.ok) {
      throw createError({ statusCode: result.statusCode, message: result.message });
    }

    return { success: true, title: "Added!", pokemon: result.pokemon };
  } catch (err: unknown) {
    return rethrowHttpOrUnavailable(err);
  }
});
