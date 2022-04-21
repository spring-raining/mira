import path from 'path';
import { commonPlugins } from '../../rollup.config';
import * as packageJson from './package.json';

const output = [
  {
    input: [
      path.resolve(__dirname, 'src/index.ts'),
      path.resolve(__dirname, 'src/eval.ts'),
      path.resolve(__dirname, 'src/runtime.ts'),
      path.resolve(__dirname, 'src/viteConfig.ts'),
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
    external: Object.keys(packageJson.peerDependencies),
    plugins: commonPlugins,
  },
];

export default output;
