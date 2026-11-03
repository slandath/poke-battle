import { vi } from "vitest";

/**
 * H3/Nitro globals used by the server routes.
 *
 * `defineEventHandler` is called while handler modules are evaluated, so these
 * stubs must exist before a spec imports a handler. `setupFiles` run first,
 * which is why this lives here instead of in an individual test file.
 */

export interface RequestFixture {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, unknown>;
}

const request: Required<RequestFixture> = { body: undefined, params: {}, query: {} };

/** Seed the request state that the stubbed globals read for the next handler call. */
export function setRequest(fixture: RequestFixture = {}): void {
  request.body = fixture.body;
  request.params = fixture.params ?? {};
  request.query = fixture.query ?? {};
}

vi.stubGlobal("defineEventHandler", <T>(handler: T): T => handler);
// Nitro registers plugins at module load; the default export is the plain function.
vi.stubGlobal("defineNitroPlugin", <T>(plugin: T): T => plugin);

vi.stubGlobal("createError", (input: { statusCode?: number; message?: string } = {}) =>
  Object.assign(new Error(input.message ?? "Error"), {
    statusCode: input.statusCode ?? 500,
  }),
);

vi.stubGlobal("readBody", async () => request.body);
vi.stubGlobal("getQuery", () => request.query);
vi.stubGlobal("getRouterParam", (_event: unknown, key: string) => request.params[key]);
