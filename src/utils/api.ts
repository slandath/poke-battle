import { fetchDamageRelations, formatPokemonData } from "@/utils/format";

import type { FormattedPokemon, Pokemon } from "../types/pokemon";

const url = "https://pokeapi.co/api/v2/pokemon/";

export async function searchPokemon(query: string): Promise<FormattedPokemon> {
  const response = await fetch(url + encodeURIComponent(query.trim().toLowerCase()));
  if (!response.ok) {
    if (response.status === 404) throw new Error("Pokemon not found");
    throw new Error(`API Error: ${response.status}`);
  }
  const data: Pokemon = await response.json();
  const damageRelations = await fetchDamageRelations(data.types);
  return { ...formatPokemonData(data), damageRelations };
}
