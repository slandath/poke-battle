import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import * as schema from "../database/schema";
import { useDb } from "./db";
import { httpStatus } from "./http-error";

let cachedAuth: any | null = null;

export function getAuth(): any {
  if (cachedAuth) return cachedAuth;

  const config = useRuntimeConfig() as {
    betterAuthSecret?: string;
    betterAuthUrl?: string;
    githubClientId?: string;
    githubClientSecret?: string;
  };

  const githubClientId = config.githubClientId;
  const githubClientSecret = config.githubClientSecret;

  cachedAuth = betterAuth({
    database: drizzleAdapter(useDb(), {
      provider: "pg",
      schema,
    }),
    secret: config.betterAuthSecret || undefined,
    baseURL: config.betterAuthUrl || undefined,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders:
      githubClientId && githubClientSecret
        ? {
            github: {
              clientId: githubClientId,
              clientSecret: githubClientSecret,
            },
          }
        : {},
    session: {
      expiresIn: 60 * 60 * 24 * 7,
    },
  });

  return cachedAuth;
}

export async function requireSession(event: { headers: Headers }) {
  let auth: ReturnType<typeof getAuth>;
  try {
    auth = getAuth();
  } catch (err) {
    console.error(err);
    throw createError({ statusCode: 503, message: "Database unavailable" });
  }

  try {
    const session = await auth.api.getSession({ headers: event.headers });
    if (!session?.user) {
      throw createError({ statusCode: 401, message: "Unauthorized" });
    }
    return session;
  } catch (err: unknown) {
    if (httpStatus(err) === 401) throw err;
    console.error(err);
    throw createError({ statusCode: 503, message: "Database unavailable" });
  }
}
