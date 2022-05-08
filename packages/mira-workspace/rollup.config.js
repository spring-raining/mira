import path from 'path';
import { commonPlugins } from '../../rollup.config';
import * as packageJson from './package.json';

const output = [
  {
    input: [path.resolve(__dirname, 'module/index.ts')],
    output: [
      {
        dir: path.resolve(__dirname, 'dist'),
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        format: 'module',
        exports: 'named',
        sourcemap: true,
      },
    ],
    external: Object.keys(packageJson.dependencies),
    plugins: commonPlugins,
  },
];

export default output;
