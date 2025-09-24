import js from "@eslint/js";
import ts from "typescript-eslint";
import storybook from "eslint-plugin-storybook";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const nodeGlobals = {
  __dirname: "readonly",
  __filename: "readonly",
  require: "readonly",
  module: "readonly",
  exports: "readonly",
  process: "readonly",
};

const typescriptConfigs = ts.configs.recommended.map((config) => ({
  ...config,
  files: ["**/*.{ts,tsx}", "**/*.mts"],
}));

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/prisma/**",
    ],
  },
  js.configs.recommended,
  ...typescriptConfigs,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: [
      "*.config.{js,cjs,mjs,ts}",
      "postcss.config.*",
      "next.config.*",
      "scripts/**/*.{js,cjs,mjs,ts}",
    ],
    languageOptions: {
      sourceType: "module",
      globals: nodeGlobals,
    },
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
  ...storybook.configs["flat/recommended"],
];

export default config;
