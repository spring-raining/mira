import React, { createContext, useContext } from 'react';
import { useHistoryContext } from './hooks/history/context';
import { useProvidenceContext } from './hooks/providence/context';
import { useHmr } from './hooks/useHmr';
import { RefreshModuleEvent } from './types';

const universeContext = createContext<{
  refreshModule: (message: RefreshModuleEvent) => void;
  addRefreshModuleListener: (fn: (message: RefreshModuleEvent) => void) => void;
  removeRefreshModuleListener: (
    fn: (message: RefreshModuleEvent) => void
  ) => void;
}>({
  refreshModule: () => {},
  addRefreshModuleListener: () => {},
  removeRefreshModuleListener: () => {},
});

export const useUniverseContext = () => {
  return useContext(universeContext);
};

export const UniverseProvider: React.FC = ({ children }) => {
  const hmrProvider = useHmr();
  const { HistoryProvider } = useHistoryContext();
  const { ProvidenceProvider } = useProvidenceContext();

  return (
    <universeContext.Provider value={{ ...hmrProvider }}>
      <HistoryProvider>
        <ProvidenceProvider>{children}</ProvidenceProvider>
      </HistoryProvider>
    </universeContext.Provider>
  );
};
