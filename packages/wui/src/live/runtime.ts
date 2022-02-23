import type { RuntimeEnvironmentFactory } from '@mirajs/core';
import { loadModule, resolveImportSpecifier } from '../mdx/imports';
import { RuntimeEnvironment } from '../types';
import { genRunEnvId } from './../util';

export type Runtime = { getRuntimeEnvironment: () => RuntimeEnvironment };

export const setupRuntime = async ({
  runtime,
  moduleLoader,
  depsRootPath,
}: {
  runtime: string;
  moduleLoader: (specifier: string) => Promise<unknown>;
  depsRootPath: string;
}): Promise<Runtime> => {
  const runtimeSpecifier = resolveImportSpecifier({
    specifier: runtime,
  });
  const runtimeModule = (await loadModule({
    specifier: runtimeSpecifier,
    moduleLoader,
    depsRootPath,
  })) as any;
  const { getRuntimeScope } = (
    runtimeModule.runtimeEnvironmentFactory as RuntimeEnvironmentFactory
  )();

  return {
    getRuntimeEnvironment: () => ({
      envId: genRunEnvId(),
      getRuntimeScope,
    }),
  };
};
