import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Pokemon, TypeDamageResponse } from "#shared/types/pokemon";
import { searchPokemon } from "~/utils/api";
import { pokemonCache } from "~/utils/cache";
import { pokeApiLimiter, RATE_LIMIT } from "~/utils/rateLimiter";

const fetchMock = vi.hoisted(() => vi.fn());

mockNuxtImport("$fetch", () => fetchMock);

const pokemon: Pokemon = {
  name: "pikachu",
  types: [{ slot: 1, type: { name: "electric", url: "" } }],
  sprites: {
    back_default: null,
    back_female: null,
    front_default: "https://poke.test/pikachu.png",
    front_shiny: null,
    other: {},
  },
};

const typeDamage: TypeDamageResponse[] = [
  {
    damage_relations: {
      double_damage_from: [{ name: "ground" }],
      half_damage_from: [],
      no_damage_from: [],
    },
  },
];

beforeEach(() => {
  pokemonCache.clear();
  pokeApiLimiter.reset();
  fetchMock.mockReset();
  fetchMock.mockImplementation((url: string) => (url.includes("/type/") ? typeDamage[0] : pokemon));
});

describe("Pokemon search cache", () => {
  it("serves repeat searches from cache without new API calls", async () => {
    const first = await searchPokemon("Pikachu");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const second = await searchPokemon("  pikachu  ");
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not spend rate-limit tokens on cache hits", async () => {
    await searchPokemon("pikachu");
    await searchPokemon("PIKACHU");

    expect(pokeApiLimiter.status.value.remaining).toBe(RATE_LIMIT - 2);
  });

  it("fetches again for a different Pokemon", async () => {
    await searchPokemon("pikachu");
    await searchPokemon("charizard");

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
