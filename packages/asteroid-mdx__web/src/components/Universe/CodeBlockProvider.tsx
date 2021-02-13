// Derived from react-live source
// https://github.com/FormidableLabs/react-live
import React from 'react';
import { LiveContext } from 'react-live';
import { transform as _transform } from 'buble';
import assign from 'core-js/fn/object/assign';
import { CodeBlockStatus } from '../../contexts/universe';
import { getRuntimeScope } from '../runtimeScopes';

// eslint-disable-next-line no-new-func
const AsyncFunctionShim = new Function(
  'return Object.getPrototypeOf(async function(){}).constructor'
)();

const _poly = { assign };
const evalCode = (code: string, scope: Record<string, any>) => {
  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((key) => scope[key]);
  try {
    const res = new AsyncFunctionShim('_poly', 'React', ...scopeKeys, code);
    return res(_poly, React, ...scopeValues);
  } catch (error) {
    return Promise.reject(error);
  }
};

const transform = (code: string) =>
  _transform(code, {
    objectAssign: '_poly.assign',
    transforms: {
      asyncAwait: false,
      arrow: false,
      dangerousForOf: true,
      dangerousTaggedTemplateString: true,
    } as any,
  });

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
  // eslint-disable-next-line consistent-return
) => {
  const runtimeScope = getRuntimeScope({
    resultCallback,
    errorCallback,
    errorBoundary: errorBoundary(errorCallback),
  });

  try {
    const transformed = transform(code);
    return await evalCode(transformed.code, {
      ...scope,
      ...runtimeScope,
    });
  } catch (error) {
    throw error;
  }
};

interface CodeBlockProviderProps {
  code: string;
  scope: Record<string, any>;
  status: CodeBlockStatus | null;
  onRender: (result: Promise<object | null>) => void;
  asteroidId?: string;
  transformCode?: (code: string) => string;
}

export class CodeBlockProvider extends React.Component<CodeBlockProviderProps> {
  static defaultProps = {
    code: '',
  };

  componentDidUpdate(prevProps: CodeBlockProviderProps) {
    const {
      code: prevCode,
      scope: prevScope,
      transformCode: prevTransformCode,
      status: prevStatus,
    } = prevProps;
    const { code, scope, transformCode, status } = this.props;
    if (prevStatus !== 'running' && status === 'running') {
      if (
        (prevStatus !== 'live' && prevStatus !== 'outdated') ||
        code !== prevCode ||
        // shallow compare
        Object.keys(scope).length !== Object.keys(prevScope).length ||
        Object.keys(scope).some((k) => scope[k] !== prevScope[k]) ||
        transformCode !== prevTransformCode
      ) {
        this.transpile({ code, scope, transformCode });
      }
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
      this.setState({ ...state, element });

    // State reset object
    const state = { unsafeWrapperError: undefined, error: undefined };

    this.setState({ ...state, element: null }); // Reset output for async (no inline) evaluation
    onRender(
      new Promise((resolve, reject) => {
        renderElementAsync(input, renderElement, errorCallback)
          .then((ret) => {
            resolve(typeof ret === 'object' ? ret : null);
          })
          .catch((error) => {
            errorCallback(error);
            reject(error);
          });
      })
    );
  };

  render() {
    const { children, code } = this.props;

    return (
      <LiveContext.Provider
        value={
          {
            ...this.state,
            code,
            onError: this.onError,
            onChange: this.onChange,
          } as any
        }
      >
        {children}
      </LiveContext.Provider>
    );
  }
}
