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
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        // https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks#advanced-configuration
        additionalHooks: '(useMemoWithPrev)',
      },
    ],
  },
};
