import js from "@eslint/js";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "p5.js", "public/**"]
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        process: "readonly",
        window: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  }
];
