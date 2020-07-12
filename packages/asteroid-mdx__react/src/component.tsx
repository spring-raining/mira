import React, {
  useState,
  useEffect,
  useMemo,
  ComponentType,
  ReactChild,
} from 'react';

const getRuntimeScope = ({
  resultCallback,
  errorCallback,
  errorBoundary,
}: {
  resultCallback: (result: ComponentType) => void;
  errorCallback: (error: Error) => void;
  errorBoundary: (element: any) => ComponentType;
}): { $run: (element: any) => void } => {
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

const buildErrorBoundary = (errorCallback: (error: Error) => void) => (
  Element: any
) => {
  return class ErrorBoundary extends React.Component<
    {},
    { hasError: boolean }
  > {
    constructor(props: {}) {
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
      return typeof Element === 'function' ? <Element /> : Element;
    }
  };
};

export const component = (
  config: any,
  render: ({ $run }: { $run: (element: any) => void }) => Promise<any>
): React.FC<{}> => {
  return () => {
    const [element, setElement] = useState<ReactChild | null>(null);
    const runtimeScope = useMemo(
      () =>
        getRuntimeScope({
          resultCallback: (Element) => setElement(<Element />),
          errorCallback: (error) => {
            throw error;
          },
          errorBoundary: buildErrorBoundary((error) => {
            throw error;
          }),
        }),
      []
    );

    useEffect(() => {
      (async () => {
        const ret = await render(runtimeScope);
      })();
    }, []);

    return <div>{element}</div>;
  };
};
