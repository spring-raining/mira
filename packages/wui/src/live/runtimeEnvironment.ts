import { runtimeEnvironmentFactory } from '@mirajs/react';
import { nanoid } from 'nanoid';
import { RuntimeEnvironment } from '../types';

export const setupRuntimeEnvironment = (): RuntimeEnvironment => {
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
};
