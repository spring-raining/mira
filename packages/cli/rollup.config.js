import path from 'path';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import * as packageJson from './package.json';

const plugins = [
  replace({
    values: {
      'process.env.DEV': !!process.env.DEV,
    },
    preventAssignment: true,
  }),
  nodeResolve({ preferBuiltins: true }),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
  }),
];

const nodeOutput = {
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
  plugins,
};

export default [nodeOutput];
