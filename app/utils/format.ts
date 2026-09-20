import type {
  DamageRelations,
  FormattedPokemon,
  Pokemon,
  TypeDamageResponse,
} from "#shared/types/pokemon";

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Normalize a raw PokeAPI pokemon response into the shape used by the UI,
 * capitalizing the name/types and flattening the sprite to a single URL.
 */
export function formatPokemonData(data: Pokemon): FormattedPokemon {
  return {
    name: capitalize(data.name),
    types: data.types.map((t: { type: { name: string } }) => capitalize(t.type.name)),
    sprites: data.sprites.front_default || undefined,
  };
}

/**
 * Resolve conflicting type matchups for a Pokemon.
 *
 * PokeAPI reports effectiveness per type independently, but a multi-type Pokemon
 * combines them with Pokemon's multiplicative type chart. Two combinations must
 * be collapsed:
 *
 * - A type appearing in both `doubleDamageFrom` (2x) and `halfDamageFrom` (0.5x)
 *   multiplies to 1x, so it is neutral and removed from both.
 * - A type appearing in both `halfDamageFrom` (0.5x) and `noDamageFrom` (0x)
 *   multiplies to 0x, so immunity wins and it is removed from `halfDamageFrom`.
 *
 * Overlaps are computed against the pre-filter state so the two rules do not
 * interfere with each other. Returns a new object; the input is not mutated.
 */
export function resolveTypeOverlaps(relations: DamageRelations): DamageRelations {
  const overlapTypes = relations.doubleDamageFrom.filter((type) =>
    relations.halfDamageFrom.includes(type),
  );
  const noDamageOverlap = relations.halfDamageFrom.filter((type) =>
    relations.noDamageFrom.includes(type),
  );

  return {
    doubleDamageFrom: relations.doubleDamageFrom.filter((type) => !overlapTypes.includes(type)),
    halfDamageFrom: relations.halfDamageFrom.filter(
      (type) => !overlapTypes.includes(type) && !noDamageOverlap.includes(type),
    ),
    noDamageFrom: relations.noDamageFrom,
  };
}

/**
 * Merge the `damage_relations` of every type a Pokemon has into one result,
 * de-duplicating repeated matchup names across types before resolving the
 * multi-type overlaps (see `resolveTypeOverlaps`).
 */
export function mergeDamageRelations(dataArray: TypeDamageResponse[]): DamageRelations {
  const relations: DamageRelations = {
    doubleDamageFrom: [],
    halfDamageFrom: [],
    noDamageFrom: [],
  };

  dataArray.forEach((data) => {
    data.damage_relations.double_damage_from.forEach((t) => {
      const capitalizedName = capitalize(t.name);
      if (!relations.doubleDamageFrom.includes(capitalizedName)) {
        relations.doubleDamageFrom.push(capitalizedName);
      }
    });

    data.damage_relations.half_damage_from.forEach((t) => {
      const capitalizedName = capitalize(t.name);
      if (!relations.halfDamageFrom.includes(capitalizedName)) {
        relations.halfDamageFrom.push(capitalizedName);
      }
    });

    data.damage_relations.no_damage_from.forEach((t) => {
      const capitalizedName = capitalize(t.name);
      if (!relations.noDamageFrom.includes(capitalizedName)) {
        relations.noDamageFrom.push(capitalizedName);
      }
    });
  });

  return resolveTypeOverlaps(relations);
}
