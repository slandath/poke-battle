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
  try {
    const url = 'https://pokeapi.co/api/v2/type/'
    const relations: DamageRelations = {
      doubleDamageFrom: [],
      halfDamageFrom: [],
      noDamageFrom: [],
    }

    const responses = await Promise.all(
      types.map(typeObj => fetch(url + typeObj.type.name)),
    )
    responses.forEach((response, index) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch type: ${types[index]?.type.name}`)
      }
    })

    const dataArray = await Promise.all(
      responses.map(response => response.json()),
    )
    dataArray.forEach((data) => {
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
    })
    const overlapTypes = relations.doubleDamageFrom.filter(type =>
      relations.halfDamageFrom.includes(type),
    )
    const noDamageOverlap = relations.halfDamageFrom.filter(type =>
      relations.noDamageFrom.includes(type),
    )

    relations.doubleDamageFrom = relations.doubleDamageFrom.filter(
      type => !overlapTypes.includes(type),
    )
    relations.halfDamageFrom = relations.halfDamageFrom.filter(
      type => !overlapTypes.includes(type),
    )
    relations.halfDamageFrom = relations.halfDamageFrom.filter(
      type => !noDamageOverlap.includes(type),
    )

    return relations
  }
  catch (err) {
    throw new Error(
      err instanceof Error ? err.message : 'Error fetching damage relations',
    )
  }
}
