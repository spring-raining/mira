import esbuild from 'esbuild';
import { MiraTranspilerBase } from '../../src';

export class TestTranspiler implements MiraTranspilerBase {
  get isInitialized(): boolean {
    return true;
  }

  async init() {
    // NOOP
  }

  async build(options: esbuild.BuildOptions) {
    try {
      const { outputFiles, errors, warnings } = await esbuild.build({
        ...options,
        write: false,
      });
      return {
        result: outputFiles,
        errors,
        warnings,
      };
    } catch (error) {
      const { errors, warnings } = error;
      return {
        errorObject: error as Error,
        errors,
        warnings,
      };
    }
  }

  async transform(input: string, options?: esbuild.TransformOptions) {
    try {
      const { code, map, warnings } = await esbuild.transform(input, options);
      return {
        result: { code, map },
        errors: [],
        warnings,
      };
    } catch (error) {
      const { errors, warnings } = error;
      return {
        errorObject: error as Error,
        errors,
        warnings,
      };
    }
  }
}
