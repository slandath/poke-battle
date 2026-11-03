import { describe, expect, it } from "vitest";

import type { DamageRelations, Pokemon, TypeDamageResponse } from "#shared/types/pokemon";
import { formatPokemonData, mergeDamageRelations, resolveTypeOverlaps } from "~/utils/format";

function pokemonFixture(
  name: string,
  types: string[],
  frontDefault: string | null = "https://example.test/sprite.png",
): Pokemon {
  return {
    name,
    types: types.map((type, index) => ({
      slot: index + 1,
      type: { name: type, url: `https://pokeapi.co/api/v2/type/${type}` },
    })),
    sprites: {
      back_default: null,
      back_female: null,
      front_default: frontDefault,
      front_shiny: null,
      other: {},
    },
  };
}

function relations(overrides: Partial<DamageRelations> = {}): DamageRelations {
  return {
    doubleDamageFrom: [],
    halfDamageFrom: [],
    noDamageFrom: [],
    ...overrides,
  };
}

function typeDamage(
  damage: Partial<TypeDamageResponse["damage_relations"]> = {},
): TypeDamageResponse {
  return {
    damage_relations: {
      double_damage_from: [],
      half_damage_from: [],
      no_damage_from: [],
      ...damage,
    },
  };
}

const named = (name: string) => ({ name });

describe("formatPokemonData", () => {
  it("capitalizes the name and every type", () => {
    const result = formatPokemonData(pokemonFixture("pikachu", ["electric"]));

    expect(result.name).toBe("Pikachu");
    expect(result.types).toEqual(["Electric"]);
  });

  it("preserves type order instead of sorting", () => {
    const result = formatPokemonData(pokemonFixture("charizard", ["fire", "flying"]));

    expect(result.types).toEqual(["Fire", "Flying"]);
  });

  it("maps a missing sprite to undefined rather than null", () => {
    const result = formatPokemonData(pokemonFixture("pikachu", ["electric"], null));

    expect(result.sprites).toBeUndefined();
  });

  it("keeps an available sprite url", () => {
    const result = formatPokemonData(pokemonFixture("pikachu", ["electric"]));

    expect(result.sprites).toBe("https://example.test/sprite.png");
  });
});

describe("resolveTypeOverlaps", () => {
  it("returns a new object without mutating the input", () => {
    const input = relations({ doubleDamageFrom: ["Fire"], halfDamageFrom: ["Water"] });
    const result = resolveTypeOverlaps(input);

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
    expect(input.doubleDamageFrom).toEqual(["Fire"]);
    expect(input.halfDamageFrom).toEqual(["Water"]);
  });

  it("removes a type that is both double damage and half damage (2x x 0.5x = neutral)", () => {
    const result = resolveTypeOverlaps(
      relations({ doubleDamageFrom: ["Fire"], halfDamageFrom: ["Fire", "Water"] }),
    );

    expect(result.doubleDamageFrom).toEqual([]);
    expect(result.halfDamageFrom).toEqual(["Water"]);
  });

  it("lets immunity win over a half-damage matchup (0.5x x 0x = 0x)", () => {
    const result = resolveTypeOverlaps(
      relations({ halfDamageFrom: ["Fighting", "Water"], noDamageFrom: ["Fighting"] }),
    );

    expect(result.halfDamageFrom).toEqual(["Water"]);
    expect(result.noDamageFrom).toEqual(["Fighting"]);
  });

  it("lets immunity win over a double-damage matchup (2x x 0x = 0x) — #45", () => {
    // Hisuian Zoroark (Normal/Ghost): Normal is weak to Fighting, Ghost is immune to it.
    const result = resolveTypeOverlaps(
      relations({
        doubleDamageFrom: ["Fighting", "Ghost", "Dark"],
        noDamageFrom: ["Fighting", "Normal"],
      }),
    );

    expect(result.doubleDamageFrom).toEqual(["Ghost", "Dark"]);
    expect(result.noDamageFrom).toEqual(["Fighting", "Normal"]);
  });

  it("collapses the three-way overlap (2x x 0.5x x 0x = 0x) into immunity", () => {
    const result = resolveTypeOverlaps(
      relations({
        doubleDamageFrom: ["Fighting"],
        halfDamageFrom: ["Fighting"],
        noDamageFrom: ["Fighting"],
      }),
    );

    expect(result.doubleDamageFrom).toEqual([]);
    expect(result.halfDamageFrom).toEqual([]);
    expect(result.noDamageFrom).toEqual(["Fighting"]);
  });

  it("is a no-op when there are no conflicts", () => {
    const input = relations({
      doubleDamageFrom: ["Fire", "Ice"],
      halfDamageFrom: ["Water"],
      noDamageFrom: ["Normal"],
    });

    expect(resolveTypeOverlaps(input)).toEqual(input);
  });
});

describe("mergeDamageRelations", () => {
  it("returns empty lists for an empty input", () => {
    expect(mergeDamageRelations([])).toEqual(relations());
  });

  it("capitalizes type names from a single type", () => {
    const result = mergeDamageRelations([
      typeDamage({
        double_damage_from: [named("water")],
        half_damage_from: [named("grass")],
        no_damage_from: [named("normal")],
      }),
    ]);

    expect(result).toEqual(
      relations({
        doubleDamageFrom: ["Water"],
        halfDamageFrom: ["Grass"],
        noDamageFrom: ["Normal"],
      }),
    );
  });

  it("de-duplicates a type repeated across both types", () => {
    const result = mergeDamageRelations([
      typeDamage({ double_damage_from: [named("water")] }),
      typeDamage({ double_damage_from: [named("water")] }),
    ]);

    expect(result.doubleDamageFrom).toEqual(["Water"]);
  });

  it("de-duplicates half-damage and immune matchups across types", () => {
    const result = mergeDamageRelations([
      typeDamage({ half_damage_from: [named("grass")], no_damage_from: [named("normal")] }),
      typeDamage({ half_damage_from: [named("grass")], no_damage_from: [named("normal")] }),
    ]);

    expect(result.halfDamageFrom).toEqual(["Grass"]);
    expect(result.noDamageFrom).toEqual(["Normal"]);
  });

  it("resolves conflicts that only appear after merging two types", () => {
    const result = mergeDamageRelations([
      typeDamage({ double_damage_from: [named("ground")] }),
      typeDamage({ half_damage_from: [named("ground")] }),
    ]);

    expect(result.doubleDamageFrom).toEqual([]);
    expect(result.halfDamageFrom).toEqual([]);
  });

  it("does not mutate the raw API payload", () => {
    const payload = typeDamage({ double_damage_from: [named("water")] });
    const before = JSON.stringify(payload);

    mergeDamageRelations([payload]);

    expect(JSON.stringify(payload)).toBe(before);
  });
});
