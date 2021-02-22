import React, { createContext, useContext } from 'react';
import { getRuntimeScope } from '@asteroid-mdx/react';

// eslint-disable-next-line no-new-func
const AsyncFunctionShim = new Function(
  'return Object.getPrototypeOf(async function(){}).constructor'
)();

const evalCode = (code: string, scope: Record<string, any>) => {
  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((key) => scope[key]);
  try {
    const res = new AsyncFunctionShim(...scopeKeys, code);
    return res(...scopeValues);
  } catch (error) {
    return Promise.reject(error);
  }
};

const errorBoundary = (errorCallback: (error: Error) => void) => (
  Element: React.ReactNode
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

const renderElementAsync = async (
  { code = '', scope = {} },
  resultCallback: (result: React.ReactNode) => void,
  errorCallback: (error: Error) => void
) => {
  const runtimeScope = getRuntimeScope({
    resultCallback,
    errorCallback,
    errorBoundary: errorBoundary(errorCallback),
  });

  try {
    // TODO
    // const transformed = transform(code);
    const transformed = code;
    return await evalCode(transformed, {
      ...scope,
      ...runtimeScope,
    });
  } catch (error) {
    throw error;
  }
};

interface LiveContextValue {
  code: string;
  onError: (error: Error) => void;
  onChange: (code: string) => void;
  element?: React.ReactNode | null;
  error?: string | null;
}

const LiveContext = createContext<LiveContextValue | null>(null);

interface CodeBlockProviderProps {
  code: string;
  scope: Record<string, any>;
  // status: 'init' | 'live' | 'outdated' | 'running' | null;
  onRender: (result: Promise<object | null>) => void;
  asteroidId?: string;
  transformCode?: (code: string) => string;
}

export class LiveProvider extends React.Component<CodeBlockProviderProps> {
  static defaultProps = {
    code: '',
    scope: {},
    onRender: () => {},
  };

  componentDidUpdate(prevProps: CodeBlockProviderProps) {
    const {
      code: prevCode,
      scope: prevScope,
      // status: prevStatus,
    } = prevProps;
    const { code, scope, transformCode } = this.props;
    if (
      code !== prevCode ||
      // shallow compare
      Object.keys(scope).length !== Object.keys(prevScope).length ||
      Object.keys(scope).some((k) => scope[k] !== prevScope[k])
    ) {
      this.transpile({ code, scope, transformCode });
    }
  }

  onChange = (code: string) => {
    const { scope, transformCode } = this.props;
    this.transpile({ code, scope, transformCode });
  };

  onError = (error: Error) => {
    this.setState({ error: error.toString() });
  };

  transpile = ({
    code,
    scope,
    transformCode,
  }: {
    code: string;
    scope: Record<string, any>;
    transformCode?: (code: string) => string;
  }) => {
    const { onRender } = this.props;
    // Transpilation arguments
    const input = {
      code: transformCode ? transformCode(code) : code,
      scope,
    };

    const errorCallback = (err: Error) =>
      this.setState({ element: undefined, error: err.toString() });
    const renderElement = (element: React.ReactNode) =>
      this.setState({ error: undefined, element });
    this.setState({ error: undefined, element: null }); // Reset output for async (no inline) evaluation
    onRender(
      new Promise((resolve, reject) => {
        renderElementAsync(input, renderElement, errorCallback)
          .then((ret) => {
            resolve(typeof ret === 'object' ? ret : null);
          })
          .catch((error) => {
            errorCallback(error);
          });
      })
    );
  };

  render() {
    const { children, code } = this.props;

    return (
      <LiveContext.Provider
        value={{
          ...this.state,
          code,
          onError: this.onError,
          onChange: this.onChange,
        }}
      >
        {children}
      </LiveContext.Provider>
    );
  }
}

export const useLivedComponent = (): LiveContextValue | null => {
  const live = useContext(LiveContext);
  if (!live) {
    return null;
  }
  return live;
};
