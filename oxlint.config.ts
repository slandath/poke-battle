import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: [
    "dist",
    "node_modules",
    ".pnpm-store",
    "dist-ssr",
    ".nuxt",
    ".output",
    ".data",
    "app/components/ui/**/index.ts",
    "server/database/migrations",
    "drizzle.config.ts",
  ],
  categories: {
    correctness: "error",
    suspicious: "error",
  },
  plugins: ["typescript", "vue", "unicorn", "import", "oxc", "promise", "node"],
  env: {
    browser: true,
    node: true,
  },
  globals: {
    defineNuxtConfig: "readonly",
    useState: "readonly",
    useHead: "readonly",
    useNuxtData: "readonly",
    navigateTo: "readonly",
    $fetch: "readonly",
    ref: "readonly",
    computed: "readonly",
    watch: "readonly",
    onMounted: "readonly",
    onUnmounted: "readonly",
  },
  options: {
    typeAware: true,
    typeCheck: true,
  },
  rules: {
    "import/no-unassigned-import": "off",
    "preserve-caught-error": "off",
  },
  overrides: [
    {
      files: ["app/**/*.{ts,vue}", "shared/**/*.{ts,vue}", "server/**/*.{ts,vue}"],
      plugins: ["typescript", "vue"],
    },
    {
      files: ["server/utils/db.ts", "server/utils/auth.ts"],
      rules: {
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/no-redundant-type-constituents": "off",
      },
    },
  ],
});
