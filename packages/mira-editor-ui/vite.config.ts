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
    sourcemap: true,
    rollupOptions: {
      external: [
        ...Object.keys(packageJson.dependencies),
        ...Object.keys(packageJson.peerDependencies),
        'cssesc',
      ],
    },
  },
  plugins: [react(), vanillaExtractPlugin({ identifiers: 'debug' })],
});
