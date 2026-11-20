import type { FormattedPokemon } from "#shared/types/pokemon";

function isCacheEntries(value: unknown): value is Record<string, CacheEntry> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        "data" in entry &&
        "timestamp" in entry &&
        typeof entry.timestamp === "number",
    )
  );
}

/** Pokemon data rarely changes; one day is a conservative TTL. */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const CACHE_STORAGE_KEY = "poke-battle:pokemon-cache:v1";

export interface CacheEntry {
  data: FormattedPokemon;
  timestamp: number;
}

export interface CacheStats {
  size: number;
  keys: string[];
}

/** Names are case-insensitive and whitespace-tolerant throughout the cache. */
export function normalizeCacheKey(query: string): string {
  return query.trim().toLowerCase();
}

/** localStorage cache with an in-memory fallback when storage is unavailable or full. */
export class PokemonCache {
  private readonly fallback = new Map<string, CacheEntry>();

  constructor(private readonly storage?: Storage) {}

  get(query: string, now: number = Date.now()): FormattedPokemon | null {
    const key = normalizeCacheKey(query);
    if (!key) return null;

    const entry = this.fallback.get(key) ?? this.read()[key];
    if (!entry) return null;

    if (now - entry.timestamp >= CACHE_TTL_MS) {
      this.delete(key);
      return null;
    }
    return entry.data;
  }

  set(query: string, data: FormattedPokemon, now: number = Date.now()): void {
    const key = normalizeCacheKey(query);
    if (!key) return;

    const entry: CacheEntry = { data, timestamp: now };
    const entries = this.read();
    entries[key] = entry;
    if (!this.write(entries)) this.fallback.set(key, entry);
  }

  /** Removes expired entries and returns how many were dropped. */
  cleanup(now: number = Date.now()): number {
    let removed = 0;
    for (const [key, entry] of this.fallback) {
      if (now - entry.timestamp >= CACHE_TTL_MS) {
        this.fallback.delete(key);
        removed++;
      }
    }

    const entries = this.read();
    for (const [key, entry] of Object.entries(entries)) {
      if (now - entry.timestamp >= CACHE_TTL_MS) {
        delete entries[key];
        removed++;
      }
    }
    this.write(entries);
    return removed;
  }

  clear(): void {
    this.fallback.clear();
    try {
      this.getStorage()?.removeItem(CACHE_STORAGE_KEY);
    } catch {
      // Storage is best-effort; the in-memory fallback is already cleared.
    }
  }

  getStats(): CacheStats {
    const keys = new Set([...this.fallback.keys(), ...Object.keys(this.read())]);
    return { size: keys.size, keys: [...keys].toSorted() };
  }

  private getStorage(): Storage | undefined {
    if (this.storage) return this.storage;
    if (typeof window === "undefined") return undefined;
    try {
      return window.localStorage;
    } catch {
      return undefined;
    }
  }

  private read(): Record<string, CacheEntry> {
    try {
      const raw = this.getStorage()?.getItem(CACHE_STORAGE_KEY);
      if (!raw) return {};
      const parsed: unknown = JSON.parse(raw);
      if (!isCacheEntries(parsed)) return {};
      return parsed;
    } catch {
      return {};
    }
  }

  private write(entries: Record<string, CacheEntry>): boolean {
    const storage = this.getStorage();
    if (!storage) return false;
    try {
      storage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch {
      return false;
    }
  }

  private delete(key: string): void {
    this.fallback.delete(key);
    const entries = this.read();
    if (key in entries) {
      delete entries[key];
      this.write(entries);
    }
  }
}

/** Single cache shared by all searches in this browser tab. */
export const pokemonCache = new PokemonCache();
