import { and, eq } from "drizzle-orm";

import { team, teamPokemon } from "../../database/schema";
import { requireSession } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { rethrowHttpOrUnavailable } from "../../utils/http-error";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);

  const id = Number(getRouterParam(event, "id"));
  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, message: "Missing or invalid id" });
  }

  try {
    const db = useDb();

    const memorial = await db
      .select()
      .from(team)
      .where(and(eq(team.id, id), eq(team.userId, session.user.id), eq(team.status, "enshrined")))
      .then((r: any) => r[0]);

    if (!memorial) {
      throw createError({ statusCode: 404, message: "Memorial not found" });
    }

    await db.delete(teamPokemon).where(eq(teamPokemon.teamId, id));
    await db.delete(team).where(eq(team.id, id));

    return { success: true, title: "Memorial deleted" };
  } catch (err: unknown) {
    return rethrowHttpOrUnavailable(err);
  }
});
