import path from 'path';
import typescript from '@rollup/plugin-typescript';
import * as packageJson from './package.json';

const plugins = [
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
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name]-[hash].mjs',
        format: 'module',
        exports: 'named',
        sourcemap: true,
      },
    ],
    external: [
      ...Object.keys(packageJson.dependencies),
      ...Object.keys(packageJson.peerDependencies),
    ],
    plugins,
  },
];

export default output;
