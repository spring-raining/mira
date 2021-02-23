import { ServiceOptions } from 'esbuild-wasm';

export const defaultConfig: ServiceOptions = {
  wasmURL: 'https://cdn.jsdelivr.net/npm/esbuild-wasm@0.8.50/esbuild.wasm',
  worker: true,
};
