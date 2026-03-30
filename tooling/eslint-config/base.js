const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project,
  },
  plugins: ["@typescript-eslint", "import"],
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "import/order": [
      "error",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
    "import/no-restricted-paths": [
      "error",
      {
        zones: [
          {
            target: "./apps/frontend/src/features",
            from: "./apps/frontend/src/features",
            except: ["./[^/]+/index.ts"],
            message: "Features should not import from other features directly. Use the shared types or services layer instead.",
          },
        ],
      },
    ],
  },
  ignorePatterns: ["node_modules/", "dist/", "build/", ".turbo/"],
};
