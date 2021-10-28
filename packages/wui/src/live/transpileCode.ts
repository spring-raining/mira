import {
  init as initTranspiler,
  Service as TranspilerService,
} from '@mirajs/transpiler';
import { MarkerMessage, TranspiledResult } from '../types';

let transpilerService: TranspilerService;
export const transpileCode = async ({
  code,
  declaredValues = [],
  bundle = true,
  sourcemap = true,
}: {
  code: string;
  declaredValues?: string[];
  bundle?: boolean;
  sourcemap?: boolean;
}): Promise<TranspiledResult> => {
  if (!transpilerService) {
    transpilerService = await initTranspiler();
    // TODO: teardown
    // transpilerService.stop();
  }
  const mapMessage = (
    messages: { text: string; location: MarkerMessage['location'] | null }[]
  ) =>
    messages.flatMap<MarkerMessage>(({ text, location }) =>
      location ? { location, text } : []
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
                contents: declaredValues
                  .map(
                    (val) =>
                      `export const ${val} = /* @__PURE__ */ $use('${val}');`
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
      target: 'es2020',
      globalName: '$_exports',
      footer: bundle
        ? '$_exports=$_exports||{};$val($_exports);$run($_exports.default)'
        : undefined,
      logLevel: 'silent',
      jsxFactory: '$jsxFactory',
      jsxFragment: '$jsxFragment',
    });
    return {
      text: transpiled.outputFiles[0].text,
      warnings: mapMessage(transpiled.warnings),
      errors: [],
    };
  } catch (error) {
    return {
      errorObject: error,
      errors: mapMessage(error.errors ?? []),
      warnings: mapMessage(error.warnings ?? []),
    };
  }
};
