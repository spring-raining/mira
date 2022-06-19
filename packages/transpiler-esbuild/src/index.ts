import type {
  BuildSuccess,
  BuildFailure,
  TransformSuccess,
  TransformFailure,
  MiraTranspilerBase,
} from '@mirajs/util';
import type esbuild from 'esbuild';
import { BuildOptions, TransformOptions } from 'esbuild';

export interface InitOptions {
  transpilerPlatform?: 'node' | 'browser';
  wasmURL?: string;
  wasmModule?: WebAssembly.Module;
}
export type { BuildOptions, TransformOptions };

export const DEFAULT_ESBUILD_WASM_URL = `https://cdn.jsdelivr.net/npm/esbuild-wasm@${process.env.ESBUILD_VERSION}/esbuild.wasm`;

export class EsbuildTranspiler
  implements MiraTranspilerBase<InitOptions, BuildOptions, TransformOptions>
{
  _esbuild?: typeof esbuild;

  get isInitialized(): boolean {
    return !!this._esbuild;
  }

  async init({ transpilerPlatform, ...other }: InitOptions): Promise<void> {
    if (
      (process.env.SUPPORT_PLATFORM === 'all' ||
        process.env.SUPPORT_PLATFORM === 'browser') &&
      transpilerPlatform === 'browser'
    ) {
      this._esbuild = await import('esbuild-wasm');
      if (!other.wasmURL && !other.wasmModule) {
        other.wasmURL = DEFAULT_ESBUILD_WASM_URL;
      }
      await this._esbuild.initialize({ ...other, worker: true });
      return;
    }
    if (
      (process.env.SUPPORT_PLATFORM === 'all' ||
        process.env.SUPPORT_PLATFORM === 'node') &&
      transpilerPlatform === 'node'
    ) {
      this._esbuild = await import('esbuild');
      return;
    }
    throw new Error(`Unknown transpilerPlatform: ${transpilerPlatform}`);
  }

  async build(options: BuildOptions): Promise<BuildSuccess | BuildFailure> {
    if (!this._esbuild) {
      throw new Error('Transpiler not initialized');
    }
    try {
      const { outputFiles, errors, warnings } = await this._esbuild.build({
        ...options,
        write: false,
      });
      return {
        result: outputFiles,
        errors,
        warnings,
      };
    } catch (error) {
      const { errors, warnings } = error as BuildFailure;
      return {
        errorObject: error as Error,
        errors,
        warnings,
      };
    }
  }

  async transform(
    input: string,
    options?: TransformOptions,
  ): Promise<TransformSuccess | TransformFailure> {
    if (!this._esbuild) {
      throw new Error('Transpiler not initialized');
    }
    try {
      const { code, map, warnings } = await this._esbuild.transform(
        input,
        options,
      );
      return {
        result: { code, map },
        errors: [],
        warnings,
      };
    } catch (error) {
      const { errors, warnings } = error as TransformFailure;
      return {
        errorObject: error as Error,
        errors,
        warnings,
      };
    }
  }
}
