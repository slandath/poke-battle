/**
 * PokeAPI game-version allowlist (static snapshot of
 * `GET https://pokeapi.co/api/v2/version?limit=100`).
 *
 * Static validation avoids a server-side PokeAPI dependency on every write.
 * Refresh this list if PokeAPI adds versions (e.g. re-fetch and extend).
 */
const VERSIONS = [
  "red",
  "blue",
  "yellow",
  "gold",
  "silver",
  "crystal",
  "ruby",
  "sapphire",
  "emerald",
  "firered",
  "leafgreen",
  "diamond",
  "pearl",
  "platinum",
  "heartgold",
  "soulsilver",
  "black",
  "white",
  "colosseum",
  "xd",
  "black-2",
  "white-2",
  "x",
  "y",
  "omega-ruby",
  "alpha-sapphire",
  "sun",
  "moon",
  "ultra-sun",
  "ultra-moon",
  "lets-go-pikachu",
  "lets-go-eevee",
  "sword",
  "shield",
  "the-isle-of-armor-sword",
  "the-crown-tundra-sword",
  "brilliant-diamond",
  "shining-pearl",
  "legends-arceus",
  "scarlet",
  "violet",
  "the-teal-mask-scarlet",
  "the-indigo-disk-scarlet",
  "red-japan",
  "green-japan",
  "blue-japan",
  "legends-za",
  "mega-dimension",
  "champions",
  "the-isle-of-armor-shield",
  "the-crown-tundra-shield",
  "the-teal-mask-violet",
  "the-indigo-disk-violet",
] as const;

export type GameVersion = (typeof VERSIONS)[number];

const VERSION_SET: ReadonlySet<string> = new Set<string>(VERSIONS);

export const GAME_VERSIONS: readonly string[] = VERSIONS;

export const DEFAULT_GAME_VERSION = "red";

export function normalizeVersion(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const slug = input.trim().toLowerCase();
  if (!slug) return null;
  return VERSION_SET.has(slug) ? slug : null;
}

export function isGameVersion(input: unknown): input is GameVersion {
  return normalizeVersion(input) !== null;
}
