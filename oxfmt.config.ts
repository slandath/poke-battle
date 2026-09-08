import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  sortImports: true,
  sortTailwindcss: {
    entryPoint: "app/assets/css/main.css",
  },
  sortPackageJson: true,
  vueIndentScriptAndStyle: false,
  ignorePatterns: [
    "dist",
    "node_modules",
    "pnpm-lock.yaml",
    ".pnpm-store",
    "dist-ssr",
    ".nuxt",
    ".output",
    ".data",
    "server/database/migrations",
  ],
});
