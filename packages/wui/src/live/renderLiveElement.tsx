import React from 'react';
import { RuntimeEnvironment } from '../types';

export const renderLiveElement = ({
  environment,
  resultCallback,
  errorCallback,
}: {
  environment: RuntimeEnvironment;
  resultCallback: (result: React.ReactNode) => void;
  errorCallback: (error: Error) => void;
}) => {
  if (!environment.render) {
    return;
  }
  try {
    resultCallback(environment.render(errorCallback));
  } catch (error) {
    if (error instanceof Error) {
      errorCallback(error);
    }
  }
};
