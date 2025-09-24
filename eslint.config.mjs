// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nodeGlobals = {
  __dirname: "readonly",
  __filename: "readonly",
  require: "readonly",
  module: "readonly",
  exports: "readonly",
  process: "readonly",
};

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/generated/prisma/**",
    ],
  },
  {
    files: [
      "*.config.js",
      "*.config.cjs",
      "*.config.mjs",
      "postcss.config.*",
      "next.config.*",
    ],
    languageOptions: {
      sourceType: "module",
      globals: nodeGlobals,
    },
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },
  {
    files: ["scripts/**/*.{js,cjs,mjs,ts}"],
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

export default eslintConfig;
