import path from 'path';
import replace from '@rollup/plugin-replace';
import { commonPlugins } from '../../rollup.config';
import * as packageJson from './package.json';

const getOutput = (outputDir, supportPlatform) => ({
  input: [path.resolve(__dirname, 'src/index.ts')],
  output: [
    {
      dir: outputDir,
      entryFileNames: '[name].js',
      chunkFileNames: '[name]-[hash].js',
      format: 'module',
      exports: 'named',
      sourcemap: true,
    },
  ],
  external: Object.keys(packageJson.dependencies),
  plugins: [
    ...commonPlugins,
    replace({
      values: {
        'process.env.ESBUILD_VERSION': JSON.stringify(
          packageJson.dependencies.esbuild,
        ),
        'process.env.SUPPORT_PLATFORM': JSON.stringify(supportPlatform),
      },
      preventAssignment: true,
    }),
  ],
});

export default [
  getOutput(path.resolve(__dirname, 'dist'), 'all'),
  getOutput(path.resolve(__dirname, 'dist', 'node'), 'node'),
  getOutput(path.resolve(__dirname, 'dist', 'browser'), 'browser'),
];
