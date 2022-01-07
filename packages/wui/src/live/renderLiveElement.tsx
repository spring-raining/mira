import React from 'react';
import { RuntimeEnvironment } from '../types';

const errorBoundary = (errorCallback: (error: Error) => void) => {
  return class ErrorBoundary extends React.Component<
    unknown,
    { hasError: boolean }
  > {
    constructor(props: unknown) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(error: Error) {
      errorCallback(error);
    }
    render() {
      if (this.state.hasError) {
        return null;
      }
      return this.props.children;
    }
  };
};

export const renderLiveElement = ({
  environment,
  resultCallback,
  errorCallback,
}: {
  environment: RuntimeEnvironment;
  resultCallback: (result: React.ReactNode) => void;
  errorCallback: (error: Error) => void;
}): RuntimeEnvironment | null => {
  const ErrorBoundary = errorBoundary(errorCallback);
  try {
    if (typeof environment.render !== 'undefined') {
      const Element =
        typeof environment.render === 'function'
          ? environment.render
          : () => environment.render;
      resultCallback(
        <ErrorBoundary>
          <Element />
        </ErrorBoundary>,
      );
    }
    return environment;
  } catch (error) {
    if (error instanceof Error) {
      errorCallback(error);
    }
    return null;
  }
};
