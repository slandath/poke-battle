import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("better-auth", () => ({ betterAuth: vi.fn() }));
vi.mock("better-auth/adapters/drizzle", () => ({ drizzleAdapter: vi.fn(() => ({})) }));
vi.mock("~~/server/utils/db", () => ({ useDb: vi.fn(() => ({})) }));

async function loadAuth() {
  const auth = await import("~~/server/utils/auth");
  const { betterAuth } = await import("better-auth");
  return { ...auth, betterAuthMock: vi.mocked(betterAuth) };
}

const event = () => ({ headers: new Headers() });

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal("useRuntimeConfig", () => ({}));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("requireSession (production implementation)", () => {
  it("returns the session when a user is present", async () => {
    const { requireSession, betterAuthMock } = await loadAuth();
    const session = { user: { id: "user-1" } };
    betterAuthMock.mockReturnValue({ api: { getSession: async () => session } } as any);

    await expect(requireSession(event())).resolves.toBe(session);
  });

  it("throws 401 when the session is null", async () => {
    const { requireSession, betterAuthMock } = await loadAuth();
    betterAuthMock.mockReturnValue({ api: { getSession: async () => null } } as any);

    await expect(requireSession(event())).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 when the session has no user", async () => {
    const { requireSession, betterAuthMock } = await loadAuth();
    betterAuthMock.mockReturnValue({ api: { getSession: async () => ({}) } } as any);

    await expect(requireSession(event())).rejects.toMatchObject({ statusCode: 401 });
  });

  it("maps a lookup failure to 503", async () => {
    const { requireSession, betterAuthMock } = await loadAuth();
    betterAuthMock.mockReturnValue({
      api: {
        getSession: async () => {
          throw new Error("db down");
        },
      },
    } as any);

    await expect(requireSession(event())).rejects.toMatchObject({
      statusCode: 503,
      message: "Database unavailable",
    });
  });

  it("maps auth initialization failure to 503", async () => {
    const { requireSession, betterAuthMock } = await loadAuth();
    betterAuthMock.mockImplementation(() => {
      throw new Error("misconfigured");
    });

    await expect(requireSession(event())).rejects.toMatchObject({
      statusCode: 503,
      message: "Database unavailable",
    });
  });
});
