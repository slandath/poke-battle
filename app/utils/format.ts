import type {
  DamageRelations,
  FormattedPokemon,
  Pokemon,
  TypeDamageResponse,
} from "#shared/types/pokemon";

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function formatPokemonData(data: Pokemon): FormattedPokemon {
  return {
    name: capitalize(data.name),
    types: data.types.map((t: { type: { name: string } }) => capitalize(t.type.name)),
    sprites: data.sprites.front_default || undefined,
  };
}

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

  const overlapTypes = relations.doubleDamageFrom.filter((type: string) =>
    relations.halfDamageFrom.includes(type),
  );
  const noDamageOverlap = relations.halfDamageFrom.filter((type: string) =>
    relations.noDamageFrom.includes(type),
  );

  relations.doubleDamageFrom = relations.doubleDamageFrom.filter(
    (type: string) => !overlapTypes.includes(type),
  );
  relations.halfDamageFrom = relations.halfDamageFrom.filter(
    (type: string) => !overlapTypes.includes(type),
  );
  relations.halfDamageFrom = relations.halfDamageFrom.filter(
    (type: string) => !noDamageOverlap.includes(type),
  );

  return relations;
}
