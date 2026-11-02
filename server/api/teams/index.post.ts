import { eq } from "drizzle-orm";

import { teamPokemon } from "../../database/schema";
import { requireSession } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { rethrowHttpOrUnavailable } from "../../utils/http-error";
import { getOrCreateActiveTeam } from "../../utils/teams";
import { normalizeVersion } from "../../utils/versions";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);

  const body = await readBody<{
    version: string;
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

  const version = normalizeVersion(body?.version);
  if (!version) {
    throw createError({ statusCode: 400, message: "Missing or invalid version" });
  }

  if (!body?.pokemon?.name || !Array.isArray(body.pokemon.types)) {
    throw createError({ statusCode: 400, message: "Invalid pokemon payload" });
  }

  try {
    const db = useDb();

    const result = await db.transaction(async (tx) => {
      const userTeam = await getOrCreateActiveTeam(tx, session.user.id, version);

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
        const pgCode = err?.code ?? err?.cause?.code;
        if (pgCode === "23505" || err?.message?.includes("team_pokemon_team_id_name_unique")) {
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
