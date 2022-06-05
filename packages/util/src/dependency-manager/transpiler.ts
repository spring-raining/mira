import { MiraTranspilerBase } from '../types';

export const transformCode = async ({
  transpiler,
  code,
}: {
  transpiler: MiraTranspilerBase;
  code: string;
}) => {
  const transformed = await transpiler.transform(code, {
    // loader should be tsx even if the code is JavaScript to strip unused imports
    loader: 'tsx',
    sourcefile: '[Mira]',
    treeShaking: true,
    target: 'es2020',
    logLevel: 'silent',
  });
  const transformedCode = transformed.result?.code;
  if (transformed.errorObject || typeof transformedCode !== 'string') {
    // Failed to transform
    throw transformed.errorObject ?? new Error('Failed to parse code');
  }
  return transformedCode;
};
