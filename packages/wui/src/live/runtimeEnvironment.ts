import { runtimeEnvironmentFactory } from '@mirajs/react';
import { nanoid } from 'nanoid';
import { resolveImportSpecifier } from '../mdx/imports';
import { RuntimeEnvironment } from '../types';

export const setupRuntimeEnvironment = ({
  runtime,
}: {
  runtime: string;
}): { getRuntimeEnvironment: () => RuntimeEnvironment } => {
  const actualRuntime = resolveImportSpecifier({
    specifier: runtime,
    path: '.',
  });

  return {
    getRuntimeEnvironment: () => {
      const { exportVal, referenceVal, getRuntimeScope } =
        runtimeEnvironmentFactory();

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
