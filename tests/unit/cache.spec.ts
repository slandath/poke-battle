import { describe, expect, it } from "vitest";

import type { FormattedPokemon } from "#shared/types/pokemon";
import { CACHE_TTL_MS, normalizeCacheKey, PokemonCache } from "~/utils/cache";

class FakeStorage implements Storage {
  private readonly data = new Map<string, string>();

  [key: string]: any;

  get length() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }

  getItem(key: string) {
    return this.data.get(key) ?? null;
  }

  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}

class FailingStorage extends FakeStorage {
  override setItem(): void {
    throw new Error("QuotaExceededError");
  }
}

const mon = (name: string): FormattedPokemon => ({ name, types: ["normal"], sprites: undefined });
const NOW = 1_000_000;

describe("normalizeCacheKey", () => {
  it("lowercases and trims", () => {
    expect(normalizeCacheKey("  PIKACHU  ")).toBe("pikachu");
  });
});

describe("PokemonCache", () => {
  it("round-trips a Pokemon case-insensitively", () => {
    const cache = new PokemonCache(new FakeStorage());
    cache.set("Pikachu", mon("Pikachu"), NOW);

    expect(cache.get("  pikachu  ", NOW)).toEqual(mon("Pikachu"));
  });

  it("expires entries after 24 hours", () => {
    const cache = new PokemonCache(new FakeStorage());
    cache.set("pikachu", mon("Pikachu"), NOW);

    expect(cache.get("pikachu", NOW + CACHE_TTL_MS - 1)).not.toBeNull();
    expect(cache.get("pikachu", NOW + CACHE_TTL_MS)).toBeNull();
  });

  it("removes expired entries on cleanup", () => {
    const cache = new PokemonCache(new FakeStorage());
    cache.set("pikachu", mon("Pikachu"), NOW);
    cache.set("charizard", mon("Charizard"), NOW);

    expect(cache.cleanup(NOW + CACHE_TTL_MS)).toBe(2);
    expect(cache.getStats().size).toBe(0);
  });

  it("works from memory when localStorage is unavailable", () => {
    const cache = new PokemonCache();
    cache.set("pikachu", mon("Pikachu"), NOW);

    expect(cache.get("pikachu", NOW)).toEqual(mon("Pikachu"));
  });

  it("falls back to memory when storage writes fail", () => {
    const cache = new PokemonCache(new FailingStorage());
    cache.set("pikachu", mon("Pikachu"), NOW);

    expect(cache.get("pikachu", NOW)).toEqual(mon("Pikachu"));
    expect(cache.getStats().keys).toEqual(["pikachu"]);
  });

  it("clears both storage and the memory fallback", () => {
    const cache = new PokemonCache(new FakeStorage());
    cache.set("pikachu", mon("Pikachu"), NOW);
    cache.clear();

    expect(cache.get("pikachu", NOW)).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });
});
