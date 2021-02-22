import { ComponentType } from "react";
import { RuntimeScope } from '@asteroid-mdx/core';

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
        errorCallback(error);
      }
    }
  };
  return { $run };
};
