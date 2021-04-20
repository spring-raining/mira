import { transform, Loader, TransformResult } from 'esbuild';
import { EsbuildConfig } from './types';

export async function esbuildTransform({
  config,
  code,
  filePath,
  loader,
  target,
}: {
  config: EsbuildConfig;
  code: string;
  filePath: string;
  loader: Loader;
  target: string | string[];
}): Promise<Omit<TransformResult, 'map'>> {
  const { code: transformedCode, warnings } = await transform(code, {
    sourcefile: filePath,
    sourcemap: 'inline',
    loader,
    target,
    // don't set any format for JS-like formats, otherwise esbuild reformats the code unnecesarily
    format: ['js', 'jsx', 'ts', 'tsx'].includes(loader) ? undefined : 'esm',
    jsxFactory: config.jsxFactory,
    jsxFragment: config.jsxFragment,
    define: config.define,
  });

  return { code: transformedCode, warnings };
}
