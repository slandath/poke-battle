import type { FormattedPokemon, Pokemon, TypeDamageResponse } from "#shared/types/pokemon";

import { getPokeApiEndpoints } from "./apiConfig";
import { formatPokemonData, mergeDamageRelations } from "./format";
import { pokeApiLimiter } from "./rateLimiter";

/** Every PokeAPI call goes through here so one search (1 + N type requests) is counted accurately. */
function fetchWithRateLimit<T>(url: string): Promise<T> {
  if (!pokeApiLimiter.tryRequest()) {
    const { resetInSeconds } = pokeApiLimiter.status.value;
    throw new Error(`Rate limit reached. Try again in ${resetInSeconds}s`);
  }
  return $fetch<T>(url);
}

export async function fetchPokemon(query: string): Promise<Pokemon> {
  const trimmed = query.trim().toLowerCase();
  try {
    return await fetchWithRateLimit<Pokemon>(
      `${getPokeApiEndpoints().pokemon}${encodeURIComponent(trimmed)}`,
    );
  } catch (err: any) {
    // $fetch throws FetchError with statusCode
    if (err?.statusCode === 404 || err?.status === 404) {
      throw new Error("Pokemon not found");
    }
    if (err?.statusCode) {
      throw new Error(`API Error: ${err.statusCode}`);
    }
    if (err instanceof Error) throw err;
    throw new Error("Error fetching data");
  }
}

export async function fetchTypeDamage(typeNames: string[]): Promise<TypeDamageResponse[]> {
  try {
    const { type } = getPokeApiEndpoints();
    return await Promise.all(
      typeNames.map((name) => fetchWithRateLimit<TypeDamageResponse>(`${type}${name}`)),
    );
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Error fetching damage relations");
  }
}

export async function searchPokemon(query: string): Promise<FormattedPokemon> {
  const data = await fetchPokemon(query);
  const typeDamage = await fetchTypeDamage(data.types.map((t) => t.type.name));
  return { ...formatPokemonData(data), damageRelations: mergeDamageRelations(typeDamage) };
}
