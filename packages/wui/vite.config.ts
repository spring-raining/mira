import path from 'path';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import * as packageJson from './package.json';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'module/index.ts'),
      formats: ['es'],
      fileName: (format) => `index.${format}.js`,
    },
    outDir: path.resolve(__dirname, 'dist'),
    // avoid deleting type directory on development
    emptyOutDir: false,
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.dependencies),
        ...Object.keys(packageJson.peerDependencies),
        'mdast-util-to-hast',
        'mdast-util-to-markdown',
        'mdast-util-to-mdx/to-markdown',
        'unist-util-visit',
      ],
    },
  },
  plugins: [react(), vanillaExtractPlugin({ identifiers: 'debug' })],
});
