import type { TestDb } from "./db";

/** Mutable slots read lazily by the module mocks declared in each server spec. */
export const dbRef: { current: TestDb | undefined } = { current: undefined };

export interface TestSession {
  user: { id: string; name: string; email: string };
}

export const sessionRef: { current: TestSession | null } = { current: null };

export const PRIMARY_USER: TestSession = {
  user: { id: "user-1", name: "User One", email: "one@example.test" },
};

export const OTHER_USER: TestSession = {
  user: { id: "user-2", name: "User Two", email: "two@example.test" },
};

/**
 * Placeholder H3 event: every handler reaches the request only through the
 * stubbed globals (`readBody`/`getQuery`/`getRouterParam`), so the object itself
 * is never inspected.
 */
export function stubEvent(): never {
  return {} as never;
}
