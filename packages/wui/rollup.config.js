import path from 'path';
import linaria from '@linaria/rollup';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import * as packageJson from './package.json';

const plugins = [
  nodeResolve(),
  typescript({
    tsconfig: './tsconfig.module.json',
    declaration: false,
  }),
  commonjs(),
  linaria({
    sourceMap: process.env.NODE_ENV !== 'production',
  }),
  postcss(
    process.env.NODE_ENV === 'production' && {
      extract: 'styles.css',
    }
  ),
  babel({ babelHelpers: 'bundled' }),
];

const output = [
  {
    input: [path.resolve(__dirname, 'module/index.ts')],
    output: [
      {
        dir: path.resolve(__dirname, 'lib'),
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        format: 'module',
        exports: 'named',
        sourcemap: true,
      },
    ],
    external: [
      ...Object.keys(packageJson.dependencies),
      'react',
      'react-dom',
      'mdast-util-to-hast',
      'mdast-util-to-markdown',
      'mdast-util-to-mdx/to-markdown',
      'unist-util-visit',
    ],
    plugins,
  },
];

export default output;
