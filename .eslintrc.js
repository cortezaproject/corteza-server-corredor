module.exports = {
  root: false,
  env: {
    node: true,
    mocha: true,
    es6: true,
  },

  extends: [
    "eslint:recommended",
  ],

  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'comma-dangle': ['error', 'always-multiline'],
  },

  parserOptions: {
    ecmaVersion: 9,
    sourceType: 'module',
  },
}
