/**
 * Pure roster invariants shared by the team API handlers.
 *
 * Kept out of the handlers so the rules can be unit-tested without H3 or Postgres.
 * Codes (instead of only prose) are tracked in #47.
 */

export const TEAM_MAX_SIZE = 6;

export type RuleResult = { ok: true } | { ok: false; statusCode: 400; message: string };

/** A team may hold at most 6 Pokemon, and names must be unique per team. */
export function canAddPokemon(existing: readonly { name: string }[], name: string): RuleResult {
  if (existing.length >= TEAM_MAX_SIZE) {
    return { ok: false, statusCode: 400, message: "Team is full" };
  }

  if (existing.some((pokemon) => pokemon.name === name)) {
    return { ok: false, statusCode: 400, message: "Already on team!" };
  }

  return { ok: true };
}

/** Enshrining requires at least one Pokemon on the active roster (max is 6 by construction). */
export function canEnshrine(memberCount: number): RuleResult {
  if (memberCount === 0) {
    return { ok: false, statusCode: 400, message: "Team is empty" };
  }

  return { ok: true };
}
