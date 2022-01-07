import React, { createContext, useContext, useRef } from 'react';
import { useHistoryContext } from './hooks/history/context';
import { useProvidenceContext } from './hooks/providence/context';
import { useHmr } from './hooks/useHmr';
import { RefreshModuleEvent } from './types';
import { noop } from './util';

export interface UniverseContext {
  refreshModule: (message: RefreshModuleEvent) => void;
  addRefreshModuleListener: (fn: (message: RefreshModuleEvent) => void) => void;
  removeRefreshModuleListener: (
    fn: (message: RefreshModuleEvent) => void,
  ) => void;
  __cache: React.MutableRefObject<{
    inViewState: Set<string>;
  }>;
}

const universeContext = createContext<UniverseContext>({
  refreshModule: noop,
  addRefreshModuleListener: noop,
  removeRefreshModuleListener: noop,
  __cache: {
    current: {
      inViewState: new Set(),
    },
  },
});

export const useUniverseContext = () => {
  return useContext(universeContext);
};

export const UniverseProvider: React.FC = ({ children }) => {
  const hmrProvider = useHmr();
  const { HistoryProvider } = useHistoryContext();
  const { ProvidenceProvider } = useProvidenceContext();
  const __cache = useRef<UniverseContext['__cache']['current']>({
    inViewState: new Set(),
  });

  return (
    <universeContext.Provider value={{ ...hmrProvider, __cache }}>
      <HistoryProvider>
        <ProvidenceProvider>{children}</ProvidenceProvider>
      </HistoryProvider>
    </universeContext.Provider>
  );
};
