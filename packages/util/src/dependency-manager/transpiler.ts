export const defaultInitOption = {
  transpilerPlatform: 'browser',
};

export const defaultTransformOption = {
  // loader should be tsx even if the code is JavaScript to strip unused imports
  loader: 'tsx',
  sourcefile: '[Mira]',
  treeShaking: true,
  target: 'es2020',
  logLevel: 'silent',
};
