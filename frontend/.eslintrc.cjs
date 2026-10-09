module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-refresh',
    '@typescript-eslint',
  ],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off',
    // TypeScript already validates props at compile time and nothing in this
    // project uses the prop-types package; the rule's false positive on
    // React.memo with destructured props (as in PageTransition.tsx) is the
    // only thing it was catching.
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  overrides: [
    {
      // Cypress specs assert through Chai's BDD chains (`expect(x).to.exist`),
      // which are expressions by design. no-unused-expressions entered the
      // typescript-eslint v8 recommended set and flags every one of them.
      files: ['cypress/**/*.ts'],
      rules: {
        '@typescript-eslint/no-unused-expressions': 'off',
        // Cypress's own docs require `declare global { namespace Cypress {...} }`
        // to augment its Chainable interface with custom commands - there is no
        // ES-module equivalent for extending a third-party global namespace.
        '@typescript-eslint/no-namespace': 'off',
      },
    },
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
}










































