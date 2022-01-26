import type { RuntimeEnvironmentFactory } from '@mirajs/core';
import { nanoid } from 'nanoid';
import { loadModule, resolveImportSpecifier } from '../mdx/imports';
import { RuntimeEnvironment } from '../types';

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
  const { exportVal, referenceVal, getRuntimeScope } = (
    runtimeModule.runtimeEnvironmentFactory as RuntimeEnvironmentFactory
  )();

  return {
    getRuntimeEnvironment: () => {
      const environment: RuntimeEnvironment = {
        envId: nanoid(),
        exportVal,
        referenceVal,
        getRuntimeScope: ({ scopeVal }) => {
          const scope = getRuntimeScope({ scopeVal });
          return {
            ...scope,
            $_default: (element) => {
              environment.render = (errorCallback) =>
                scope.$render(element, errorCallback);
            },
          };
        },
      };
      return environment;
    },
  };
};
