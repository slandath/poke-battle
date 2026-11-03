import { describe, expect, it } from "vitest";
import { canAddPokemon, canEnshrine, TEAM_MAX_SIZE } from "~~/server/utils/team-rules";

const roster = (size: number) =>
  Array.from({ length: size }, (_, index) => ({ name: `Pokemon ${index + 1}` }));

describe("canAddPokemon", () => {
  it("allows an empty roster", () => {
    expect(canAddPokemon([], "Pikachu")).toEqual({ ok: true });
  });

  it("allows adding a sixth Pokemon", () => {
    expect(canAddPokemon(roster(TEAM_MAX_SIZE - 1), "Pikachu")).toEqual({ ok: true });
  });

  it("rejects a seventh Pokemon", () => {
    expect(canAddPokemon(roster(TEAM_MAX_SIZE), "Pikachu")).toEqual({
      ok: false,
      statusCode: 400,
      message: "Team is full",
    });
  });

  it("rejects a duplicate name", () => {
    expect(canAddPokemon(roster(2), "Pokemon 2")).toEqual({
      ok: false,
      statusCode: 400,
      message: "Already on team!",
    });
  });

  it("reports fullness before duplication", () => {
    // The order matters for UX: a full team says "Team is full" even when the name also repeats.
    expect(canAddPokemon(roster(TEAM_MAX_SIZE), "Pokemon 1")).toMatchObject({
      message: "Team is full",
    });
  });

  it("matches names case-sensitively (display names are capitalized by the client)", () => {
    expect(canAddPokemon([{ name: "Pikachu" }], "pikachu")).toEqual({ ok: true });
  });
});

describe("canEnshrine", () => {
  it("rejects an empty roster", () => {
    expect(canEnshrine(0)).toEqual({ ok: false, statusCode: 400, message: "Team is empty" });
  });

  it("allows a single Pokemon", () => {
    expect(canEnshrine(1)).toEqual({ ok: true });
  });

  it("allows a full team", () => {
    expect(canEnshrine(TEAM_MAX_SIZE)).toEqual({ ok: true });
  });

  it("rejects an overfull roster", () => {
    expect(canEnshrine(TEAM_MAX_SIZE + 1)).toEqual({
      ok: false,
      statusCode: 400,
      message: "Team has more than 6 Pokemon",
    });
  });
});
