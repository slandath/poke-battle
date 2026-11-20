import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { FormattedPokemon } from "#shared/types/pokemon";

const searchMock = vi.hoisted(() => vi.fn());

mockNuxtImport("searchPokemon", () => searchMock);

const pikachu: FormattedPokemon = {
  name: "pikachu",
  types: ["electric"],
  sprites: "https://poke.test/pikachu.png",
};

beforeEach(() => {
  searchMock.mockReset();
});

describe("usePokemonSearch", () => {
  it("reports a successful search so the caller can clear the input", async () => {
    searchMock.mockResolvedValue(pikachu);

    const { pokemonData, message, search } = usePokemonSearch();
    await expect(search("pikachu")).resolves.toBe(true);

    expect(pokemonData.value).toEqual(pikachu);
    expect(message.value).toEqual({ success: true, title: "Pokemon Found!" });
  });

  it("reports a failed search and keeps the error message", async () => {
    searchMock.mockRejectedValue(new Error("Pokemon not found"));

    const { pokemonData, message, search } = usePokemonSearch();
    await expect(search("picachu")).resolves.toBe(false);

    expect(pokemonData.value).toBeNull();
    expect(message.value).toEqual({ success: false, title: "Pokemon not found" });
    expect(searchMock).toHaveBeenCalledTimes(1);
  });

  it("clears the previous error as soon as a new search starts", async () => {
    searchMock.mockRejectedValueOnce(new Error("Pokemon not found")).mockResolvedValueOnce(pikachu);

    const { message, search } = usePokemonSearch();
    await search("picachu");

    const pending = search("pikachu");
    expect(message.value).toBeNull();
    await pending;
    expect(message.value?.success).toBe(true);
  });

  it("ignores blank queries", async () => {
    const { search } = usePokemonSearch();

    await expect(search("   ")).resolves.toBe(false);
    expect(searchMock).not.toHaveBeenCalled();
  });
});
