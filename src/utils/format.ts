import type { FormattedPokemon, Pokemon } from '../types/pokemon'

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function formatPokemonData(data: Pokemon): FormattedPokemon {
  return {
    name: capitalize(data.name),
    types: data.types.map(t => capitalize(t.type.name)),
    sprites: data.sprites.front_default || undefined,
  }
}
