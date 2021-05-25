import {
  init as initTranspiler,
  Service as TranspilerService,
} from '@asteroid-mdx/transpiler';
import { css } from 'lightwindcss';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useProvidence } from '../../state/providence';
import { MarkerMessage } from '../Editor';
import { Asteroid } from '../../types';
import { setupRuntimeEnvironment, RuntimeEnvironment } from './runtimeScope';

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

const errorBoundary = (errorCallback: (error: Error) => void) => {
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
      return this.props.children;
    }
  };
};

const useTranspilerService = () => {
  const [
    transpilerService,
    setTranspilerService,
  ] = useState<TranspilerService | null>(null);

  useEffect(() => {
    (async () => {
      setTranspilerService(await initTranspiler());
    })();
  }, []);

  const build = useMemo(() => {
    if (!transpilerService) {
      return null;
    }
    return async ({
      code,
      declaredValues = [],
    }: {
      code: string;
      declaredValues?: string[];
    }): Promise<{
      text?: string;
      map?: string;
      warnings: MarkerMessage[];
      errors: MarkerMessage[];
      errorObject?: Error;
    }> => {
      if (!transpilerService) {
        return {
          errorObject: new Error('Asteroid transpiler is not initialized'),
          errors: [],
          warnings: [],
        };
      }
      const mapMessage = (
        messages: { text: string; location: MarkerMessage['location'] | null }[]
      ) =>
        messages.flatMap<MarkerMessage>(({ text, location }) =>
          location ? { location, text } : []
        );
      try {
        const transpiled = await transpilerService.build({
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
                    contents: declaredValues
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
          footer:
            '$_exports=$_exports||{};$val($_exports);$run($_exports.default)',
          logLevel: 'silent',
          jsxFactory: '$jsxFactory',
          jsxFragment: '$jsxFragment',
        });
        return {
          text: transpiled.outputFiles[0].text,
          warnings: mapMessage(transpiled.warnings),
          errors: [],
        };
      } catch (error) {
        return {
          errorObject: error,
          errors: mapMessage(error.errors ?? []),
          warnings: mapMessage(error.warnings ?? []),
        };
      }
    };
  }, [transpilerService]);

  return { build };
};

const renderElementAsync = async (
  {
    code,
    scope = {},
    environment,
  }: {
    code: string;
    scope: Record<string, unknown>;
    environment: RuntimeEnvironment;
  },
  resultCallback: (result: React.ReactNode) => void,
  errorCallback: (error: Error) => void
): Promise<RuntimeEnvironment | null> => {
  const ErrorBoundary = errorBoundary(errorCallback);
  const runtimeScope = environment.getRuntimeScope({ scope });

  try {
    await evalCode(code, {
      ...scope,
      ...runtimeScope,
    });
    if (typeof environment.render !== 'undefined') {
      const Element =
        typeof environment.render === 'function'
          ? environment.render
          : () => environment.render;
      resultCallback(
        <ErrorBoundary>
          <Element />
        </ErrorBoundary>
      );
    }
    return environment;
  } catch (error) {
    errorCallback(error);
    return null;
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
    element?: React.ReactNode | null;
    error?: Error | null;
  };
}

const LiveContext = createContext<LiveContextValue | null>(null);

export interface LiveProviderProps {
  code: string;
  asteroid: Asteroid;
}

export const LiveProvider: React.FC<LiveProviderProps> = ({
  code: propsCode,
  asteroid,
  children,
}) => {
  const { evaluate, scope, declaredValues } = useProvidence(asteroid);

  const [code, setCode] = useState(() => propsCode);
  const [transpiledCode, setTranspiledCode] = useState<string | null>(null);
  const [output, setOutput] = useState<LiveContextValue['output']>({});
  const [errorMarkers, setErrorMarkers] = useState<MarkerMessage[]>([]);
  const [warnMarkers, setWarnMarkers] = useState<MarkerMessage[]>([]);
  const { build } = useTranspilerService();
  const [canEdit, setCanEdit] = useState(false);

  // transpile code
  useEffect(() => {
    if (!build) {
      return;
    }
    (async () => {
      const {
        text: transpiled,
        errorObject: buildError,
        errors,
        warnings,
      } = await build({
        code,
        declaredValues,
      });
      setErrorMarkers(errors);
      setWarnMarkers(warnings);
      if (buildError || typeof transpiled !== 'string') {
        setTranspiledCode(null);
        setOutput({ error: buildError! });
      } else {
        setTranspiledCode(transpiled);
      }
    })();
  }, [build, code, declaredValues]);

  // run code
  useEffect(() => {
    if (!transpiledCode) {
      return;
    }
    const environment = setupRuntimeEnvironment();
    evaluate({
      environment,
      errorCallback: (error) => setOutput({ error }),
    })(
      () =>
        new Promise((resolve) => {
          renderElementAsync(
            {
              code: transpiledCode,
              scope,
              environment,
            },
            (element) => setOutput({ element }),
            (error) => {
              setOutput({ error });
              resolve([error, null]);
            }
          ).then((ret) => {
            if (ret) {
              resolve([null, ret]);
            }
          });
        })
    );
  }, [evaluate, transpiledCode, scope]);

  useEffect(() => {
    setCanEdit(!!build);
  }, [build]);

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

export const LivedPreview: React.FC = () => {
  const live = useLivedComponent();
  return live?.output.element ? <>{live.output.element}</> : null;
};

export const LivedError: React.FC = () => {
  const live = useLivedComponent();
  return live?.output.error ? (
    <div>
      <pre
        className={css`
          white-space: pre-wrap;
        `}
      >
        {live.output.error.toString()}
      </pre>
    </div>
  ) : null;
};
