import React, { useEffect, useState } from 'react';

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

const wrapElement = (
  Element: () => React.ReactElement,
  initialProps: Record<string, unknown>,
  parentEl: HTMLElement,
) =>
  function ReactElement() {
    const [elementProps, setElementProps] = useState(initialProps);

    useEffect(() => {
      const propsChangedCallback = (event: CustomEvent) => {
        setElementProps(event.detail);
      };
      parentEl.addEventListener(
        'props-change',
        propsChangedCallback as EventListener,
      );
      return () => {
        parentEl.removeEventListener(
          'props-change',
          propsChangedCallback as EventListener,
        );
      };
    }, []);

    useEffect(() => {
      parentEl.dispatchEvent(
        new CustomEvent('update', {
          bubbles: true,
          composed: true,
        }),
      );
    }, [elementProps]);

    return <Element {...elementProps} />;
  };

export const renderElement = (
  element: any,
  initialProps: Record<string, unknown>,
  parentEl: HTMLElement,
  errorCallback: (error: Error) => void,
) => {
  const ErrorBoundary = errorBoundary(errorCallback);
  if (typeof element === 'undefined') {
    return <></>;
  }
  const Element = wrapElement(
    typeof element === 'function' ? element : () => element,
    initialProps,
    parentEl,
  );
  return (
    <ErrorBoundary>
      <Element />
    </ErrorBoundary>
  );
};
