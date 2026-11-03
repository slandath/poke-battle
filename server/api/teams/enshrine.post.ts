import { eq } from "drizzle-orm";

import { team, teamPokemon } from "../../database/schema";
import { requireSession } from "../../utils/auth";
import { useDb } from "../../utils/db";
import { rethrowHttpOrUnavailable } from "../../utils/http-error";
import { canEnshrine } from "../../utils/team-rules";
import { getOrCreateActiveTeam } from "../../utils/teams";
import { normalizeVersion } from "../../utils/versions";

export default defineEventHandler(async (event) => {
  const session = await requireSession(event);

  const body = await readBody<{ version: string; title?: string; notes?: string }>(event);

  const version = normalizeVersion(body?.version);
  if (!version) {
    throw createError({ statusCode: 400, message: "Missing or invalid version" });
  }

  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 120) : null;
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : null;

  try {
    const db = useDb();

    const result = await db.transaction(async (tx) => {
      const userTeam = await getOrCreateActiveTeam(tx, session.user.id, version);
      if (!userTeam) {
        return { ok: false as const, statusCode: 500, message: "Failed to load team" };
      }

      const members = await tx
        .select()
        .from(teamPokemon)
        .where(eq(teamPokemon.teamId, userTeam.id))
        .for("update");

      const rule = canEnshrine(members.length);
      if (!rule.ok) {
        return { ok: false as const, statusCode: rule.statusCode, message: rule.message };
      }

      await tx
        .update(team)
        .set({ status: "enshrined", enshrinedAt: new Date(), title, notes })
        .where(eq(team.id, userTeam.id));

      const [fresh] = await tx
        .insert(team)
        .values({ userId: session.user.id, version, status: "active" })
        .returning();

      if (!fresh) {
        return { ok: false as const, statusCode: 500, message: "Failed to reset team" };
      }

      return { ok: true as const, enshrinedId: userTeam.id };
    });

    if (!result.ok) {
      throw createError({ statusCode: result.statusCode, message: result.message });
    }

    return { success: true, title: "Enshrined!", enshrinedId: result.enshrinedId };
  } catch (err: unknown) {
    return rethrowHttpOrUnavailable(err);
  }
});
