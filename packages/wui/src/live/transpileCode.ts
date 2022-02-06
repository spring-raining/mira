import {
  init as initTranspiler,
  Service as TranspilerService,
} from '@mirajs/transpiler';
import { MarkerMessage, TranspiledResult } from '../types';

let transpilerService: TranspilerService;
export const transpileCode = async ({
  code,
  importModules = [],
  bundle = true,
  sourcemap = true,
}: {
  code: string;
  importModules?: [string, string[]][];
  bundle?: boolean;
  sourcemap?: boolean;
}): Promise<TranspiledResult> => {
  if (!transpilerService) {
    transpilerService = await initTranspiler();
    // TODO: teardown
    // transpilerService.stop();
  }
  const mapMessage = (
    messages: { text: string; location: MarkerMessage['location'] | null }[],
  ) =>
    messages.flatMap<MarkerMessage>(({ text, location }) =>
      location ? { location, text } : [],
    );
  try {
    const transpiled = await transpilerService.build({
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
                contents: importModules
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
      platform: 'browser',
      format: 'esm',
      target: 'es2020',
      logLevel: 'silent',
      jsxFactory: '$jsxFactory',
      jsxFragment: '$jsxFragmentFactory',
    });
    return {
      text: transpiled.outputFiles[0].text,
      warnings: mapMessage(transpiled.warnings),
      errors: [],
    };
  } catch (error) {
    const errorObject = error instanceof Error ? error : new SyntaxError();
    return {
      errorObject,
      errors: mapMessage((errorObject as any).errors ?? []),
      warnings: mapMessage((errorObject as any).warnings ?? []),
    };
  }
};
