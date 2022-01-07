import { RuntimeEnvironment } from '../types';

// eslint-disable-next-line no-new-func
const AsyncFunctionShim = new Function(
  'return Object.getPrototypeOf(async function(){}).constructor',
)();

export const asyncEval = (
  code: string,
  scope: Record<string, any>,
  environment: RuntimeEnvironment,
) => {
  const runtimeScope: Record<string, any> = {
    ...scope,
    ...environment.getRuntimeScope({ scope }),
  };
  const scopeKeys = Object.keys(runtimeScope);
  const scopeValues = scopeKeys.map((key) => runtimeScope[key]);
  try {
    const res = new AsyncFunctionShim(...scopeKeys, code);
    return res(...scopeValues);
  } catch (error) {
    return Promise.reject(error);
  }
};
