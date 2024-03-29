import { EsbuildTranspiler } from '@mirajs/transpiler-esbuild/browser';
import {
  stringifyImportDefinition,
  BuildResult,
  BuildFailure,
  ImportDefinition,
} from '@mirajs/util';

const _transpiler = (async () => {
  const transpiler = new EsbuildTranspiler();
  await transpiler.init({
    transpilerPlatform: 'browser',
  });
  return transpiler;
})();

export const buildCode = async ({
  code,
  resolvedValues = [],
  importDefinitions = [],
  bundle = true,
  sourcemap = true,
}: {
  code: string;
  resolvedValues?: readonly [string, string[]][];
  importDefinitions?: readonly ImportDefinition[];
  bundle?: boolean;
  sourcemap?: boolean;
}): Promise<BuildResult | BuildFailure> => {
  const transpiler = await _transpiler;
  if (!transpiler.isInitialized) {
    await transpiler.init({
      transpilerPlatform: 'browser',
    });
  }
  const built = await transpiler.build({
    stdin: {
      contents: code,
      loader: 'jsx',
      sourcefile: '[Mira]',
    },
    plugins: [
      {
        name: 'miraResolver',
        setup: (build) => {
          if (!bundle) {
            return;
          }
          build.onResolve({ filter: /^(blob:)https?:\/\// }, (args) => {
            return {
              path: args.path,
              external: true,
            };
          });
          build.onResolve({ filter: /.*/ }, (args) => {
            console.debug('onResolve', args);
            return {
              path: args.path,
              namespace: 'mdx',
            };
          });
          build.onLoad({ filter: /.*/, namespace: 'mdx' }, (args) => {
            console.debug('onLoad', args);
            return {
              contents: resolvedValues
                .map(
                  ([source, vals]) =>
                    `export {${vals.join(',')}} from ${JSON.stringify(
                      source,
                    )};`,
                )
                .join('\n'),
              loader: 'js',
            };
          });
        },
      },
    ],
    bundle,
    write: false,
    sourcemap: sourcemap && 'inline',
    platform: bundle ? 'browser' : 'neutral',
    format: bundle ? 'esm' : undefined,
    // Insert import statements at the top of code
    banner: {
      js: importDefinitions.map(stringifyImportDefinition).join('\n'),
    },
    target: 'es2020',
    logLevel: 'silent',
    jsxFactory: '$jsxFactory',
    jsxFragment: '$jsxFragmentFactory',
  });
  return built;
};
