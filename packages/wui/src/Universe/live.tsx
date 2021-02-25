import {
  init as initTranspiler,
  Service as TranspilerService,
} from '@asteroid-mdx/transpiler';
import type { Message } from 'esbuild-wasm';
import React, { createContext, useContext } from 'react';
import { Either } from '../atoms';
import { MarkerMessage } from '../Editor';
import { getRuntimeScope } from './runtimeScope';

// eslint-disable-next-line no-new-func
const AsyncFunctionShim = new Function(
  'return Object.getPrototypeOf(async function(){}).constructor'
)();

const evalCode = (code: string, scope: Record<string, any>) => {
  const scopeKeys = Object.keys(scope);
  const scopeValues = scopeKeys.map((key) => scope[key]);
  try {
    const res = new AsyncFunctionShim('React', ...scopeKeys, code);
    return res(React, ...scopeValues);
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
  exportValues = [],
}: {
  code: string;
  transpiler: TranspilerService;
  exportValues?: string[];
}): Promise<{
  text?: string;
  map?: string;
  warnings: Message[];
  errors: Message[];
  errorObject?: Error;
}> => {
  try {
    const transpiled = await transpiler.build({
      stdin: {
        contents: code,
        loader: 'jsx',
        sourcefile: '[Asteroid]',
      },
      plugins: [
        {
          name: 'asteroidResolver',
          setup: (build) => {
            build.onResolve({ filter: /.*/ }, (args) => ({
              path: args.path,
              namespace: 'mdx',
            }));
            build.onLoad({ filter: /.*/, namespace: 'mdx' }, () => {
              return {
                contents: exportValues
                  .map(
                    (val) =>
                      `export const ${val} = /* @__PURE__ */ $use('${val}');`
                  )
                  .join('\n'),
                loader: 'js',
              };
            });
          },
        },
      ],
      bundle: true,
      write: false,
      sourcemap: 'inline',
      platform: 'browser',
      target: 'es2020',
      globalName: '$_exports',
      footer: '$_exports=$_exports||{};$val($_exports);$run($_exports.default)',
    });
    return {
      text: transpiled.outputFiles[0].text,
      warnings: transpiled.warnings,
      errors: [],
    };
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
  resultCallback: (result: React.ComponentType) => void,
  errorCallback: (error: Error) => void
) => {
  const ErrorBoundary = errorBoundary(errorCallback);
  const [runtimeScope, evaluatee] = getRuntimeScope(scope);

  try {
    await evalCode(code, {
      ...scope,
      ...runtimeScope,
    });
    if (typeof evaluatee.render !== 'undefined') {
      resultCallback(ErrorBoundary(evaluatee.render));
    }
    return evaluatee;
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
  element?: React.ComponentType | null;
  error?: string | null;
}

const LiveContext = createContext<LiveContextValue | null>(null);

interface LiveProviderProps {
  code: string;
  scope: Record<string, any>;
  // status: 'init' | 'live' | 'outdated' | 'running' | null;
  onEvaluate: (result: Promise<Either<Error, unknown>>) => void;
  asteroidId?: string;
  transformCode?: (code: string) => string;
}

interface LiveProviderState {
  canEdit: boolean;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
  transpilerService?: TranspilerService;
  element?: React.ComponentType | null;
  error?: string | null;
}

export class LiveProvider extends React.Component<
  LiveProviderProps,
  LiveProviderState
> {
  static defaultProps = {
    code: '',
    scope: {},
    onEvaluate: () => {},
  };

  constructor(props: LiveProviderProps) {
    super(props);
    this.state = { canEdit: false };
  }

  async componentDidMount() {
    const transpilerService = await initTranspiler();
    this.setState({ transpilerService, canEdit: true });
  }

  componentDidUpdate(prevProps: LiveProviderProps) {
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
    scope: Record<string, unknown>;
    transformCode?: (code: string) => string;
  }) => {
    const { onEvaluate } = this.props;

    const errorCallback = (err: Error) =>
      this.setState({ element: undefined, error: err.toString() });
    const renderElement = (element: React.ComponentType) =>
      this.setState({ error: undefined, element });
    this.setState({ error: undefined, element: null }); // Reset output for async (no inline) evaluation

    if (!this.state.transpilerService) {
      return errorCallback(new Error('Asteroid transpiler is not initialized'));
    }
    const {
      text: transpiled,
      errorObject: transpileError,
      errors,
      warnings,
    } = await transpile({
      code: transformCode ? transformCode(code) : code,
      transpiler: this.state.transpilerService,
      exportValues: Object.keys(scope),
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
    onEvaluate(
      new Promise((resolve) => {
        renderElementAsync(input, renderElement, errorCallback)
          .then((ret) => {
            resolve([null, ret]);
          })
          .catch((error) => {
            errorCallback(error);
            resolve([error, null]);
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
