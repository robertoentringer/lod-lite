module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': [
      'error',
      { semi: false, singleQuote: true, printWidth: 100, trailingComma: 'none' }
    ],
    'comma-dangle': ['error', 'never']
  }
}
