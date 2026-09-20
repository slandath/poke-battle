import type { FormattedPokemon, Pokemon, TypeDamageResponse } from "#shared/types/pokemon";

import { formatPokemonData, mergeDamageRelations } from "./format";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
const POKEMON_URL = `${POKEAPI_BASE_URL}/pokemon/`;
const TYPE_URL = `${POKEAPI_BASE_URL}/type/`;

export async function fetchPokemon(query: string): Promise<Pokemon> {
  const trimmed = query.trim().toLowerCase();
  try {
    return await $fetch<Pokemon>(`${POKEMON_URL}${encodeURIComponent(trimmed)}`);
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
    return await Promise.all(
      typeNames.map((name) => $fetch<TypeDamageResponse>(`${TYPE_URL}${name}`)),
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
