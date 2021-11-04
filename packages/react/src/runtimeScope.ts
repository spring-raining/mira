import { ComponentType } from 'react';
import { RuntimeScope } from '@mirajs/core';

export const getRuntimeScope = ({
  resultCallback,
  errorCallback,
  errorBoundary,
}: {
  resultCallback: (result: ComponentType) => void;
  errorCallback: (error: Error) => void;
  errorBoundary: (element: any) => ComponentType;
}): RuntimeScope => {
  const $run = (element: any) => {
    if (typeof element === 'undefined') {
      errorCallback(new SyntaxError('`$run` must return valid JSX.'));
    } else {
      try {
        resultCallback(errorBoundary(element));
      } catch (error) {
        if (error instanceof Error) {
          errorCallback(error);
        }
      }
    }
  };
  return { $run };
};
