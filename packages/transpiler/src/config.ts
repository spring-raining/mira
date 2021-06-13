import { ServiceOptions } from 'esbuild-wasm';
import * as packageJson from '../package.json';

export const defaultConfig: ServiceOptions = {
  wasmURL: `https://cdn.jsdelivr.net/npm/esbuild-wasm@${packageJson.dependencies['esbuild-wasm']}/esbuild.wasm`,
  worker: true,
};
