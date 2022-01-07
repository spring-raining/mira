module.exports = {
  root: true,
  extends: [
    '../../.eslintrc.cjs',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    // 'plugin:jsx-a11y/recommended', // later
  ],
  rules: {
    'react/prop-types': 'off',
  },
};
