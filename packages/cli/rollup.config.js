import path from 'path';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const plugins = [
  nodeResolve({ preferBuiltins: true }),
  typescript({
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
      dir: path.resolve(__dirname, 'module'),
      format: 'module',
      exports: 'named',
      sourcemap: true,
    },
    {
      dir: path.resolve(__dirname, 'dist'),
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
  ],
  external: [
    '@babel/code-frame',
    '@web/dev-server',
    '@web/dev-server-core',
    '@web/dev-server-hmr',
    'camelcase',
    'chalk',
    'chokidar',
    'command-line-args',
    'command-line-usage',
    'debounce',
    'fast-glob',
    'globby',
    'ip',
  ],
  plugins,
};

export default [nodeOutput];
