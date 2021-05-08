import path from 'path';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const plugins = [
  nodeResolve(),
  typescript({
    tsconfig: './tsconfig.module.json',
    declaration: false,
  }),
  commonjs(),
  babel({ babelHelpers: 'bundled' }),
];

const output = [
  {
    input: [path.resolve(__dirname, 'module/index.ts')],
    output: [
      {
        dir: path.resolve(__dirname, 'dist'),
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
      },
    ],
    external: [
      'react',
      'recoil',
      'nanoid',
      '@asteroid-mdx/core',
      '@asteroid-mdx/transpiler',
      '@mdx-js/mdx',
    ],
    plugins,
  },
];

export default output;
