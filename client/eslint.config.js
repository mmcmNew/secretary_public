import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginStorybook from "eslint-plugin-storybook";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "18.2",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      storybook: pluginStorybook,
      "jsx-a11y": pluginJsxA11y,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs["jsx-runtime"].rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginStorybook.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ["playwright.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ignores: ["dist", ".eslintrc.cjs"],
  },
];
