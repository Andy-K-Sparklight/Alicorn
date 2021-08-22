module.exports = {
  settings: {
    react: {
      version: "detect",
    },
  },
  env: {
    browser: true,
    es2021: true,
    commonjs: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    project: ["tsconfig.json"],
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "react-hooks"],
  rules: {
    "no-empty-function": "off",
    "no-empty": "off",
    "no-debugger": "off",
    "prefer-const": "warn",
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/ban-ts-comment": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "react-hooks/rules-of-hooks": "error",
    "@typescript-eslint/no-empty-function": "off",
    "require-await": "warn",
    "@typescript-eslint/no-floating-promises": "warn",
  },
};
