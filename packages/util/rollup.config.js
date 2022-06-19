import path from 'path';
import { commonPlugins } from '../../rollup.config';
import * as packageJson from './package.json';

const output = [
  {
    input: [
      path.resolve(__dirname, 'src/index.ts'),
      path.resolve(__dirname, 'src/declaration-parser.ts'),
      path.resolve(__dirname, 'src/dependency-manager.ts'),
      path.resolve(__dirname, 'src/es-module.ts'),
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
    external: Object.keys(packageJson.dependencies || {}),
    plugins: commonPlugins,
  },
];

export default output;
