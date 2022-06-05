import { EsbuildTranspiler } from '@mirajs/transpiler-esbuild';
import type { BuildResult, BuildFailure, ImportDefinition } from '@mirajs/util';
import type { OnLoadResult } from 'esbuild';

const _transpiler = (async () => {
  const transpiler = new EsbuildTranspiler();
  await transpiler.init({ transpilerPlatform: 'node' });
  return transpiler;
})();
export const getTranspiler = async () => await _transpiler;

export const bundleCode = async ({
  code,
  loaderContents,
  globalName,
}: {
  code: string;
  loaderContents: { [path: string]: OnLoadResult };
  globalName: string;
}): Promise<BuildResult | BuildFailure> => {
  const transpiler = await _transpiler;
  return await transpiler.build({
    stdin: {
      contents: code,
      loader: 'jsx',
      sourcefile: '[Mira]',
    },
    plugins: [
      {
        name: 'miraResolver',
        setup: (build) => {
          build.onResolve({ filter: /^#/ }, (args) => {
            return {
              path: args.path,
              namespace: 'mira',
            };
          });
          build.onLoad({ filter: /^#/, namespace: 'mira' }, (args) => {
            return loaderContents[args.path];
          });
        },
      },
    ],
    bundle: true,
    write: false,
    globalName,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    logLevel: 'silent',
    jsx: 'preserve',
  });
};
