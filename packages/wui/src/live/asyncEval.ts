import { RuntimeEnvironment } from '../types';

// eslint-disable-next-line no-new-func
const AsyncFunctionShim = new Function(
  'return Object.getPrototypeOf(async function(){}).constructor',
)();

export const asyncEval = (
  code: string,
  scopeVal: Map<string, any>,
  environment: RuntimeEnvironment,
) => {
  const runtimeScope = environment.getRuntimeScope({
    scopeVal,
  });
  const evalScope = [
    ...new Map([...scopeVal, ...Object.entries(runtimeScope)]).entries(),
  ];
  const scopeKeys = evalScope.map(([k]) => k);
  const scopeValues = evalScope.map(([, v]) => v);
  try {
    const res = new AsyncFunctionShim(...scopeKeys, code);
    return res(...scopeValues);
  } catch (error) {
    return Promise.reject(error);
  }
};
