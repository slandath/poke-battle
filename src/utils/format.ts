import type {
  DamageRelations,
  FormattedPokemon,
  Pokemon,
} from '../types/pokemon'

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

export async function fetchDamageRelations(
  types: Array<{
    type: {
      name: string
    }
  }>,
): Promise<DamageRelations> {
  const relations: DamageRelations = {
    doubleDamageFrom: [],
    halfDamageFrom: [],
    noDamageFrom: [],
  }
  for (const typeObj of types) {
    const response = await fetch(
      `https://pokeapi.co/api/v2/type/${typeObj.type.name}`,
    )
    const data = await response.json()

    data.damage_relations.double_damage_from.forEach((t: any) => {
      const capitalizedName = capitalize(t.name)
      if (!relations.doubleDamageFrom.includes(capitalizedName)) {
        relations.doubleDamageFrom.push(capitalizedName)
      }
    })

    data.damage_relations.half_damage_from.forEach((t: any) => {
      const capitalizedName = capitalize(t.name)
      if (!relations.halfDamageFrom.includes(capitalizedName)) {
        relations.halfDamageFrom.push(capitalizedName)
      }
    })

    data.damage_relations.no_damage_from.forEach((t: any) => {
      const capitalizedName = capitalize(t.name)
      if (!relations.noDamageFrom.includes(capitalizedName)) {
        relations.noDamageFrom.push(capitalizedName)
      }
    })
  }

  return relations
}
