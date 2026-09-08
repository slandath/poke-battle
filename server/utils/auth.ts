import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import * as schema from "../database/schema";
import { useDb } from "./db";

let cachedAuth: any | null = null;

export function getAuth(): any {
  if (cachedAuth) return cachedAuth;

  const config = useRuntimeConfig() as {
    betterAuthSecret?: string;
    betterAuthUrl?: string;
    githubClientId?: string;
    githubClientSecret?: string;
  };

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
    socialProviders: {
      github: {
        clientId: config.githubClientId as string,
        clientSecret: config.githubClientSecret as string,
      },
    },
    // session config minimal
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
    },
  });

  return cachedAuth;
}
