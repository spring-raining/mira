module.exports = {
  root: true,
  extends: ['../../.eslintrc.cjs', 'plugin:node/recommended'],
  rules: {
    'node/no-missing-import': 'off',
    'node/no-missing-require': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-extraneous-import': [
      'error',
      {
        allowModules: [
          '@babel/code-frame',
          '@web/dev-server-core',
          'camelcase',
          'chalk',
          'chokidar',
          'command-line-args',
          'command-line-usage',
          'debounce',
          'ip',
          'koa-compose',
          'ws',
        ],
      },
    ],
  },
};
