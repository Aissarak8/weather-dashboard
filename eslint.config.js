import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".wrangler/**"],
  },
  {
    files: ["app.js", "config.example.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        API_KEY: "readonly",
      },
    },
    rules: js.configs.recommended.rules,
  },
  {
    files: ["worker/**/*.js"],
    languageOptions: {
      globals: globals.serviceworker,
    },
    rules: js.configs.recommended.rules,
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      globals: globals.node,
    },
    rules: js.configs.recommended.rules,
  },
];
