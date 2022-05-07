import { build, BuildResult, OutputFile, OnLoadResult } from 'esbuild';
import { MarkerMessage, TranspiledResult, ImportDefinition } from './types';

const wrapTranspileResult = async (
  buildResult: Promise<BuildResult & { outputFiles: OutputFile[] }>,
): Promise<TranspiledResult> => {
  const mapMessage = (
    messages: { text: string; location: MarkerMessage['location'] | null }[],
  ) =>
    messages.flatMap<MarkerMessage>(({ text, location }) =>
      location ? { location, text } : [],
    );
  try {
    const transpiled = await buildResult;
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

export const transpileCode = ({
  code,
}: {
  code: string;
  resolvedValues?: readonly [string, string[]][];
  importDefinitions?: readonly ImportDefinition[];
  bundle?: boolean;
  sourcemap?: boolean;
}): Promise<TranspiledResult> =>
  wrapTranspileResult(
    build({
      stdin: {
        contents: code,
        loader: 'jsx',
        sourcefile: '[Mira]',
      },
      bundle: false,
      write: false,
      platform: 'neutral',
      target: 'es2020',
      logLevel: 'silent',
    }),
  );

export const bundleCode = async ({
  code,
  loaderContents,
  globalName,
}: {
  code: string;
  loaderContents: { [path: string]: OnLoadResult };
  globalName: string;
}): Promise<TranspiledResult> =>
  wrapTranspileResult(
    build({
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
    }),
  );
