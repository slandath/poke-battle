import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["dist", "node_modules", ".pnpm-store", "dist-ssr"],
  categories: {
    correctness: "error",
    suspicious: "error",
  },
  plugins: ["typescript", "vue", "unicorn", "import", "oxc", "promise", "node"],
  env: {
    browser: true,
    node: true,
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
      files: ["src/**/*.{ts,vue}"],
      plugins: ["typescript", "vue"],
    },
  ],
});
