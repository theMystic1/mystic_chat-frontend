module.exports = {
  // ...
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    // optional: keep noise down during refactor
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
};
