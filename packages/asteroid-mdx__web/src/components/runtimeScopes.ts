import React from 'react';

export const getRuntimeScope = ({
  resultCallback,
  errorCallback,
  errorBoundary,
}: {
  resultCallback: (result: React.ReactNode) => void;
  errorCallback: (error: Error) => void;
  errorBoundary: (element: any) => React.ReactNode;
}) => {
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
