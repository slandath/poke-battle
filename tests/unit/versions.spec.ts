import { describe, expect, it } from "vitest";
import {
  DEFAULT_GAME_VERSION,
  GAME_VERSIONS,
  isGameVersion,
  normalizeVersion,
} from "~~/server/utils/versions";

import { DEFAULT_GAME_VERSION as CLIENT_DEFAULT } from "~/composables/useVersions";

describe("normalizeVersion", () => {
  it("accepts an allowlisted slug", () => {
    expect(normalizeVersion("red")).toBe("red");
    expect(normalizeVersion("scarlet")).toBe("scarlet");
    expect(normalizeVersion("black-2")).toBe("black-2");
  });

  it("trims and lowercases input", () => {
    expect(normalizeVersion("  RED  ")).toBe("red");
    expect(normalizeVersion("Scarlet")).toBe("scarlet");
  });

  it("rejects empty or whitespace-only input", () => {
    expect(normalizeVersion("")).toBeNull();
    expect(normalizeVersion("   ")).toBeNull();
  });

  it("rejects slugs outside the allowlist", () => {
    expect(normalizeVersion("not-a-game")).toBeNull();
    expect(normalizeVersion("red/blue")).toBeNull();
  });

  it("rejects non-string input", () => {
    expect(normalizeVersion(null)).toBeNull();
    expect(normalizeVersion(undefined)).toBeNull();
    expect(normalizeVersion(42)).toBeNull();
    expect(normalizeVersion({})).toBeNull();
    expect(normalizeVersion([])).toBeNull();
  });
});

describe("isGameVersion", () => {
  it("agrees with normalizeVersion", () => {
    const fixtures = ["red", " Red ", "", "nope", null, undefined, 7];

    for (const fixture of fixtures) {
      expect(isGameVersion(fixture)).toBe(normalizeVersion(fixture) !== null);
    }
  });
});

describe("GAME_VERSIONS", () => {
  it("has no duplicate entries", () => {
    expect(new Set(GAME_VERSIONS).size).toBe(GAME_VERSIONS.length);
  });

  it("contains the default version", () => {
    expect(GAME_VERSIONS).toContain(DEFAULT_GAME_VERSION);
  });

  it("only contains slug-shaped names", () => {
    for (const version of GAME_VERSIONS) {
      expect(version).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("DEFAULT_GAME_VERSION", () => {
  // #46: the constant is duplicated in server/utils/versions.ts and
  // app/composables/useVersions.ts — this fails first if the two ever drift.
  it("matches the client-side default", () => {
    expect(CLIENT_DEFAULT).toBe(DEFAULT_GAME_VERSION);
  });
});
