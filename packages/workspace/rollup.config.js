import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import * as packageJson from './package.json';

const plugins = [
  commonjs(),
  nodeResolve(),
  typescript({
    tsconfig: './tsconfig.module.json',
    declaration: false,
  }),
];

const nodeOutput = {
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
  plugins,
};

export default [nodeOutput];
