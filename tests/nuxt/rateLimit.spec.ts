import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPokemon, fetchTypeDamage } from "~/utils/api";
import { pokeApiLimiter, RATE_LIMIT } from "~/utils/rateLimiter";

const fetchMock = vi.hoisted(() => vi.fn());

mockNuxtImport("$fetch", () => fetchMock);

beforeEach(() => {
  pokeApiLimiter.reset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({});
});

describe("PokeAPI rate limiting", () => {
  it("blocks the 61st request with a readable error", async () => {
    for (let i = 0; i < RATE_LIMIT; i++) await fetchPokemon("pikachu");

    await expect(fetchPokemon("pikachu")).rejects.toThrow(/Rate limit reached/);
    expect(fetchMock).toHaveBeenCalledTimes(RATE_LIMIT);
  });

  it("counts type-damage requests toward the same cap", async () => {
    for (let i = 0; i < RATE_LIMIT; i++) await fetchPokemon("pikachu");

    await expect(fetchTypeDamage(["electric"])).rejects.toThrow(/Rate limit reached/);
    expect(fetchMock).toHaveBeenCalledTimes(RATE_LIMIT);
  });
});
