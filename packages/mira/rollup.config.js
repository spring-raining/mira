/* eslint-disable */
import path from 'path';
import globby from 'globby';
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
    external: [...Object.keys(packageJson.dependencies)],
    plugins: commonPlugins,
  },
  {
    input: globby.sync(path.resolve(__dirname, 'src/clientCode/*.ts')),
    output: [
      {
        dir: path.resolve(__dirname, 'dist/clientCode'),
        entryFileNames: '[name].js',
        format: 'module',
        exports: 'named',
        sourcemap: true,
      },
    ],
    external: [/\/vendor\//],
    plugins: commonPlugins,
  },
];

export default output;
