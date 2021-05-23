import React, { useState, useEffect, useMemo, ReactChild } from 'react';
import {
  parseImportStatement,
  scanImportSpecifier,
  importModules,
  AsteroidConfig,
} from '@asteroid-mdx/core';
import { getRuntimeScope } from './runtimeScope';

const importCache: Record<string, any> = {};

const loadModule = async (modules: string[]) => {
  const key = modules.join('\n');
  if (key in importCache) {
    return importCache[key];
  }
  const defs = (
    await Promise.all(
      modules.map(async (mod) => {
        const imports = await scanImportSpecifier(mod);
        return imports.map((imp) => {
          const statement = parseImportStatement(mod, imp);
          if (!statement) {
            throw new Error(`Cannot parse import declaration: ${mod}`);
          }
          return statement;
        });
      })
    )
  ).flatMap((_) => _);
  const ret = await importModules(defs);
  importCache[key] = ret;
  return ret;
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
