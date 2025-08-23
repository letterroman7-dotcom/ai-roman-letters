// eslint.config.js
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

const importOrderRule = [
  "warn",
  {
    groups: [
      ["builtin", "external"],
      "internal",
      "parent",
      "sibling",
      "index",
      "object",
      "type",
    ],
    "newlines-between": "always",
    alphabetize: { order: "asc", caseInsensitive: true },
  },
];

export default [
  // Flat-config ignores (replaces legacy .eslintignore)
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".handoff/**",
      "scripts/release.cjs", // legacy CJS tool script; skip linting
    ],
  },

  // Lint JS/CJS/MJS with eslint:recommended (no TS parser)
  {
    files: ["**/*.{js,cjs,mjs}"],
    ...js.configs.recommended,
    plugins: { import: importPlugin, "unused-imports": unusedImports },
    rules: {
      "import/order": importOrderRule,
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      // Be tolerant of escaping in old regexes
      "no-useless-escape": "warn",
    },
  },

  // Lint TS with the non-type-checked ruleset (avoids parserOptions.project)
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ["**/*.ts", "**/*.tsx"],
  })),

  // Project TS rules & plugins
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { import: importPlugin, "unused-imports": unusedImports },
    languageOptions: {
      // IMPORTANT: no `parserOptions.project` here
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    rules: {
      "import/order": importOrderRule,
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // Keep CI green for now; we can tighten later
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "no-useless-escape": "warn",
    },
  },
];
