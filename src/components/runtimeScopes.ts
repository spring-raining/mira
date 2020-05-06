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
  const $run = (element) => {
    if (typeof element === 'undefined') {
      errorCallback(new SyntaxError('`$run` must return valid JSX.'));
    } else {
      resultCallback(errorBoundary(element));
    }
  };
  return { $run };
};
