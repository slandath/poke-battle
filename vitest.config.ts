import { fileURLToPath } from "node:url";

import { defineVitestProject } from "@nuxt/test-utils/config";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "#shared": fromRoot("./shared"),
            "~~": fromRoot("."),
            "@@": fromRoot("."),
            "~": fromRoot("./app"),
            "@": fromRoot("./app"),
          },
        },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.spec.ts", "server/tests/**/*.spec.ts"],
          setupFiles: ["./server/tests/helpers/setup.ts"],
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          environment: "nuxt",
          environmentOptions: {
            nuxt: {
              overrides: {
                runtimeConfig: {
                  public: {
                    pokeApiBaseUrl: "https://poke.test/api",
                    pokeApiVersion: "v2",
                  },
                },
              },
            },
          },
          include: ["tests/nuxt/**/*.spec.ts"],
        },
      }),
    ],
    coverage: {
      provider: "v8",
      include: ["app/utils/format.ts", "server/utils/versions.ts"],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
});
