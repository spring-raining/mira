import path from 'path';
import nodeResolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

const plugins = [
  nodeResolve({ preferBuiltins: true }),
  typescript({
    tsconfig: './tsconfig.entrypoint.json',
    declaration: false,
  }),
];

const nodeOutput = {
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
    'next',
    'reflect-metadata',
    'tsyringe',
  ],
  plugins,
};

export default [nodeOutput];
