import React from 'react';

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

export const renderElement = (
  element: any,
  errorCallback: (error: Error) => void,
) => {
  const ErrorBoundary = errorBoundary(errorCallback);
  if (typeof element === 'undefined') {
    return <></>;
  }
  const Element = typeof element === 'function' ? element : () => element;
  return (
    <ErrorBoundary>
      <Element />
    </ErrorBoundary>
  );
};
