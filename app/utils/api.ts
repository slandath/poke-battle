import type { FormattedPokemon, Pokemon } from "#shared/types/pokemon";

import { fetchDamageRelations, formatPokemonData } from "./format";

const url = "https://pokeapi.co/api/v2/pokemon/";

export async function searchPokemon(query: string): Promise<FormattedPokemon> {
  const trimmed = query.trim().toLowerCase();
  try {
    const data = await $fetch<Pokemon>(`${url}${encodeURIComponent(trimmed)}`);
    const damageRelations = await fetchDamageRelations(data.types);
    return { ...formatPokemonData(data), damageRelations };
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
