// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import unused from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";

const tsRoot = path.dirname(fileURLToPath(import.meta.url));

export default [
  { ignores: ["node_modules/**", "dist/**", "data/**", "eslint.config.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: ["./tsconfig.json"], tsconfigRootDir: tsRoot, sourceType: "module" }
    },
    plugins: { import: importPlugin, "unused-imports": unused },
    rules: {
      "import/order": ["warn", { "newlines-between": "always", alphabetize: { order: "asc", caseInsensitive: true } }],
      "unused-imports/no-unused-imports": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  },
  { files: ["src/tools/diagnostics/**/*.ts"], rules: {
      "@typescript-eslint/no-unsafe-assignment":"off",
      "@typescript-eslint/no-unsafe-member-access":"off",
      "@typescript-eslint/no-unsafe-return":"off",
      "@typescript-eslint/no-unsafe-call":"off",
      "@typescript-eslint/no-unsafe-argument":"off",
      "@typescript-eslint/no-explicit-any":"off",
      "@typescript-eslint/restrict-template-expressions":"off",
      "no-console":"off"
  } }
];
