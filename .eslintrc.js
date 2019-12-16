module.exports = {
  root: false,
  env: {
    node: true,
    es6: true,
    mocha: true,
  },
  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': [
        '.ts',
      ],
    },
    'import/resolver': {
      typescript: {},
    },
  },
}

