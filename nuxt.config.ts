// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    databaseUrl: process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || "",
    betterAuthSecret: process.env.NUXT_BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET || "",
    betterAuthUrl: process.env.NUXT_BETTER_AUTH_URL || process.env.BETTER_AUTH_URL || "",
    githubClientId: process.env.NUXT_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || "",
    githubClientSecret:
      process.env.NUXT_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || "",
    public: {
      pokeApiBaseUrl: "https://pokeapi.co/api",
      pokeApiVersion: "v2",
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    // The startup migration plugin reads these from `assets:migrations`.
    // Bundling them means `drizzle-kit`'s SQL ships inside `.output`.
    serverAssets: [{ baseName: "migrations", dir: "database/migrations" }],
  },
  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: { include: ["../tests/unit/**/*"] },
  },
  devServer: {
    host: "0.0.0.0",
    port: 5173,
  },
  components: [{ path: "~/components", pathPrefix: false, ignore: ["**/index.ts"] }],
});
