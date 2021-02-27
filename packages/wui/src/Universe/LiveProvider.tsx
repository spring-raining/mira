import {
  init as initTranspiler,
  Service as TranspilerService,
} from '@asteroid-mdx/transpiler';
import type { Message } from 'esbuild-wasm';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
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

const build = async ({
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
    console.log(transpiled.outputFiles[0].text);
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
  resultCallback: (result: React.ComponentType) => void
  // errorCallback: (error: Error) => void
) => {
  const errorCallback = (error: Error) => {
    throw error;
  };
  const ErrorBoundary = errorBoundary(errorCallback);
  const [runtimeScope, evaluatee] = getRuntimeScope({ scope, errorCallback });

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

export interface LiveContextValue {
  code: string;
  canEdit: boolean;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
  onError: (error: Error) => void;
  onChange: (code: string) => void;
  output: {
    element?: React.ComponentType | null;
    error?: Error | null;
  };
}

const LiveContext = createContext<LiveContextValue | null>(null);

export interface LiveProviderProps {
  code: string;
  // scope: Record<string, any>;
  onEvaluate: (result: Promise<Either<Error, unknown>>) => void;
  asteroidId?: string;
}

export const LiveProvider: React.FC<LiveProviderProps> = ({
  code: propsCode,
  onEvaluate,
  children,
}) => {
  const [code, setCode] = useState(() => propsCode);
  const [output, setOutput] = useState<LiveContextValue['output']>({});
  const [errorMarkers, setErrorMarkers] = useState<MarkerMessage[]>([]);
  const [warnMarkers, setWarnMarkers] = useState<MarkerMessage[]>([]);
  const [
    transpilerService,
    setTranspilerService,
  ] = useState<TranspilerService | null>(null);
  const [canEdit, setCanEdit] = useState(false);

  const transpile = useCallback(
    async ({
      code,
      scope,
    }: {
      code: string;
      scope: Record<string, unknown>;
    }) => {
      if (!transpilerService) {
        return setOutput({
          error: new Error('Asteroid transpiler is not initialized'),
        });
      }
      const {
        text: transpiled,
        errorObject: buildError,
        errors,
        warnings,
      } = await build({
        code,
        transpiler: transpilerService,
        exportValues: ['x'], //Object.keys(scope),
      });
      setErrorMarkers(
        errors.flatMap<MarkerMessage>(({ text, location }) =>
          location ? { location, text } : []
        )
      );
      setWarnMarkers(
        warnings.flatMap<MarkerMessage>(({ text, location }) =>
          location ? { location, text } : []
        )
      );
      if (buildError || typeof transpiled !== 'string') {
        return setOutput({ error: buildError! });
      }
      onEvaluate(
        new Promise((resolve) => {
          renderElementAsync(
            {
              code: transpiled,
              scope,
            },
            (element) => setOutput({ element })
          )
            .then((ret) => resolve([null, ret]))
            .catch((error) => {
              setOutput({ error });
              resolve([error, null]);
            });
        })
      );
    },
    [transpilerService, onEvaluate]
  );

  useEffect(() => {
    (async () => {
      setTranspilerService(await initTranspiler());
      setCanEdit(true);
    })();
  }, []);

  useEffect(() => {
    transpile({ code, scope: {} });
  }, [code, transpile]);

  const onChange = useCallback((code: string) => {
    setCode(code);
  }, []);
  const onError = useCallback((error: Error) => {
    setOutput({ error });
  }, []);

  return (
    <LiveContext.Provider
      value={{
        code,
        canEdit,
        errorMarkers,
        warnMarkers,
        onChange,
        onError,
        output,
      }}
    >
      {children}
    </LiveContext.Provider>
  );
};

export const useLivedComponent = (): LiveContextValue | null => {
  const live = useContext(LiveContext);
  if (!live) {
    return null;
  }
  return live;
};
