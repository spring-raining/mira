import React, {
  useState,
  useEffect,
  useMemo,
  ComponentType,
  ReactChild,
} from 'react';
import {
  parseImportDeclaration,
  importModules,
  AsteroidConfig,
  RuntimeScope,
} from '@asteroid-mdx/core';

const importCache: Record<string, any> = {};

const loadModule = async (modules: string[]) => {
  const key = modules.join('\n');
  if (key in importCache) {
    return importCache[key];
  }
  const ret = await importModules(
    modules.map((mod) => {
      const declaration = parseImportDeclaration(mod);
      if (!declaration) {
        throw new Error(`Cannot parse import declaration: ${mod}`);
      }
      return declaration;
    })
  );
  importCache[key] = ret;
  return ret;
};

const getRuntimeScope = ({
  resultCallback,
  errorCallback,
  errorBoundary,
}: {
  resultCallback: (result: ComponentType) => void;
  errorCallback: (error: Error) => void;
  errorBoundary: (element: any) => ComponentType;
}): RuntimeScope => {
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
  config: AsteroidConfig,
  render: (scope: any) => Promise<any>
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
        const mod = await loadModule(config.module || []);
        const scope = {
          ...mod,
          ...runtimeScope,
        };
        await render.bind(scope)(scope);
      })();
    }, []);

    return <div>{element}</div>;
  };
};
