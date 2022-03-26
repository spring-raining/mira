import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

export const commonPlugins = [
  replace({
    values: {
      'process.env.DEV': !!process.env.DEV,
    },
    preventAssignment: true,
  }),
  commonjs(),
  nodeResolve({ preferBuiltins: true }),
  typescript({
    tsconfig: path.resolve(__dirname, './tsconfig.json'),
    declaration: false,
  }),
];
