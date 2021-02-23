import { getRuntimeScope } from '@asteroid-mdx/react';
import {
  init as initTranspiler,
  Service as TranspilerService,
} from '@asteroid-mdx/transpiler';
import type { Message } from 'esbuild-wasm';
import React, { createContext, useContext } from 'react';
import { MarkerMessage } from '../Editor';

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

const transpile = async ({
  code,
  transpiler,
}: {
  code: string;
  transpiler: TranspilerService;
}): Promise<{
  code?: string;
  map?: string;
  warnings: Message[];
  errors: Message[];
  errorObject?: Error;
}> => {
  try {
    const transpiled = await transpiler.transform(code, {
      loader: 'jsx',
      sourcefile: '[Asteroid]',
    });
    return { ...transpiled, errors: [] };
  } catch (error) {
    return {
      errorObject: error,
      errors: error.errors ?? [],
      warnings: error.warnings ?? [],
    };
  }
};

const renderElementAsync = async (
  {
    code,
    scope = {},
  }: {
    code: string;
    scope: Record<string, unknown>;
  },
  resultCallback: (result: React.ReactNode) => void,
  errorCallback: (error: Error) => void
) => {
  const runtimeScope = getRuntimeScope({
    resultCallback,
    errorCallback,
    errorBoundary: errorBoundary(errorCallback),
  });

  try {
    return await evalCode(code, {
      ...scope,
      ...runtimeScope,
    });
  } catch (error) {
    throw error;
  }
};

interface LiveContextValue {
  code: string;
  canEdit: boolean;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
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

interface CodeBlockProviderState {
  canEdit: boolean;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
  transpilerService?: TranspilerService;
  element?: React.ReactNode | null;
  error?: string | null;
}

export class LiveProvider extends React.Component<
  CodeBlockProviderProps,
  CodeBlockProviderState
> {
  static defaultProps = {
    code: '',
    scope: {},
    onRender: () => {},
  };

  constructor(props: CodeBlockProviderProps) {
    super(props);
    this.state = { canEdit: false };
  }

  async componentDidMount() {
    const transpilerService = await initTranspiler();
    this.setState({ transpilerService, canEdit: true });
  }

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

  transpile = async ({
    code,
    scope,
    transformCode,
  }: {
    code: string;
    scope: Record<string, any>;
    transformCode?: (code: string) => string;
  }) => {
    const { onRender } = this.props;

    const errorCallback = (err: Error) =>
      this.setState({ element: undefined, error: err.toString() });
    const renderElement = (element: React.ReactNode) =>
      this.setState({ error: undefined, element });
    this.setState({ error: undefined, element: null }); // Reset output for async (no inline) evaluation

    if (!this.state.transpilerService) {
      return errorCallback(new Error('Asteroid transpiler is not initialized'));
    }
    const {
      code: transpiled,
      errorObject: transpileError,
      errors,
      warnings,
    } = await transpile({
      code: transformCode ? transformCode(code) : code,
      transpiler: this.state.transpilerService,
    });
    this.setState({
      errorMarkers: errors.flatMap<MarkerMessage>(({ text, location }) =>
        location ? { location, text } : []
      ),
      warnMarkers: warnings.flatMap<MarkerMessage>(({ text, location }) =>
        location ? { location, text } : []
      ),
    });
    if (transpileError || typeof transpiled !== 'string') {
      return errorCallback(transpileError!);
    }
    const input = {
      code: transpiled,
      scope,
    };
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
