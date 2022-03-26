import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import * as packageJson from './package.json';

const plugins = [
  commonjs(),
  nodeResolve(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
  }),
];

const output = [
  {
    input: [path.resolve(__dirname, 'src/index.ts')],
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
    external: Object.keys(packageJson.dependencies),
    plugins,
  },
];

export default output;
