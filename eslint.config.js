// eslint.config.js – flat config
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import n from "eslint-plugin-n";
import importPlugin from "eslint-plugin-import";

const tsLanguage = {
  parser: tsparser,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: process.cwd(),
  },
};

const tsPlugins = {
  "@typescript-eslint": tseslint,
  import: importPlugin,
  n,
};

export default [
  { ignores: ["dist/**", "node_modules/**"] },

  // Single typed TS config for the whole repo
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: tsLanguage,
    plugins: tsPlugins,
    rules: {
      // non-blocking defaults
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-floating-promises": ["warn", { ignoreIIFE: true, ignoreVoid: true }],
      "@typescript-eslint/no-misused-promises": ["warn", { checksVoidReturn: false }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-base-to-string": "off",

      "import/order": [
        "warn",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
          groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"], ["type"]],
        },
      ],
      "n/no-process-exit": "off",
    },
  },

  // HTTP override: pragmatic exception
  {
    files: ["src/modules/http/**"],
    languageOptions: tsLanguage,
    plugins: tsPlugins,
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
];
