/** Machine-readable codes for expected team API failures. */
export const TEAM_ERROR_CODES = {
  TEAM_FULL: "TEAM_FULL",
  ALREADY_ON_TEAM: "ALREADY_ON_TEAM",
  TEAM_EMPTY: "TEAM_EMPTY",
  TEAM_OVERFULL: "TEAM_OVERFULL",
} as const;

export type TeamErrorCode = (typeof TEAM_ERROR_CODES)[keyof typeof TEAM_ERROR_CODES];

export function isTeamErrorCode(value: unknown): value is TeamErrorCode {
  return typeof value === "string" && Object.values<string>(TEAM_ERROR_CODES).includes(value);
}
