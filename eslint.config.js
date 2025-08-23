// @ts-check
import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import unused from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pull the first entry from each flat preset array
const jsRec = Array.isArray(js.configs.recommended)
  ? js.configs.recommended[0]
  : /** @type {any} */ ({});

const tsRec = Array.isArray(tseslint.configs.recommended)
  ? tseslint.configs.recommended[0]
  : /** @type {any} */ ({});

export default [
  // --------- global ignores ---------
  {
    ignores: ["node_modules/**", "dist/**", "data/**", ".handoff/**"],
  },

  // --------- JS (.js/.mjs/.cjs) ---------
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      // seed with ESLint's recommended base language options
      ...(jsRec.languageOptions ?? {}),
      ecmaVersion: "latest",
      sourceType: "module",
    },
    linterOptions: jsRec.linterOptions ?? {},
    plugins: {
      import: importPlugin,
      "unused-imports": unused,
    },
    rules: {
      ...(jsRec.rules ?? {}),
      "no-console": "off",
      "no-constant-condition": ["error", { checkLoops: false }],
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "object",
            "type",
          ],
        },
      ],
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // make sure TS-only rules are off in JS context
      "@typescript-eslint/await-thenable": "off",
    },
  },

  // --------- TS (.ts/.tsx), NON type-aware ---------
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ...(tsRec.languageOptions ?? {}),
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        // NOTE: no "project" -> stays NON type-aware (no parserServices)
      },
    },
    linterOptions: tsRec.linterOptions ?? {},
    plugins: {
      ...(tsRec.plugins ?? {}),
      import: importPlugin,
      "unused-imports": unused,
    },
    rules: {
      ...(tsRec.rules ?? {}),
      // Pragmatic TS defaults during bootstrap
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": [
        "warn",
        { "ts-expect-error": "allow-with-description" },
      ],
      // requires type info -> keep off
      "@typescript-eslint/await-thenable": "off",

      // Helpful general rules in TS files too
      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling", "index"],
            "object",
            "type",
          ],
        },
      ],
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  // --------- CJS override (scripts/*.cjs) ---------
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
    },
    rules: {
      // avoid ESM-specific plugin noise on CJS files
      "import/no-unresolved": "off",
    },
  },
];
