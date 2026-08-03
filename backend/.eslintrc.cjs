module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    // Shareable configs from a plugin need the `plugin:` prefix. Without it
    // ESLint resolves the string as a package name, fails to find it, and exits
    // before linting a single file — so `npm run lint` has never reported
    // anything for this workspace.
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // varsIgnorePattern covers the omit-by-destructuring idiom, where a binding
    // exists only so the rest spread excludes it (see /auth/me stripping
    // passwordHash). argsIgnorePattern alone does not apply to those.
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
  },
}










































