module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    '../../.eslintrc.cjs',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:@next/next/recommended',
  ],
  settings: {
    next: {
      rootDir: __dirname,
    },
  },
  rules: {
    'react/prop-types': 'off',
  },
};
