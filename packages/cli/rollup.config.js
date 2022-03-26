/* eslint-disable */
import path from 'path';
import { commonPlugins } from '../../rollup.config';
import * as packageJson from './package.json';

const output = [
  {
    input: [
      path.resolve(__dirname, 'src/cli.ts'),
      path.resolve(__dirname, 'src/index.ts'),
    ],
    output: [
      {
        dir: path.resolve(__dirname, 'dist'),
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        format: 'module',
        exports: 'named',
        sourcemap: true,
      },
    ],
    external: [
      ...Object.keys(packageJson.dependencies),
      '@babel/code-frame',
      '@web/dev-server-core',
      'camelcase',
      'chalk',
      'chokidar',
      'command-line-args',
      'command-line-usage',
      'debounce',
      'ip',
      'ws',
    ],
    plugins: commonPlugins,
  },
];

export default output;
