import React, { createContext, useContext, useRef } from 'react';
import { DependencyManager } from '../../live/dependency';
import { Mira } from '../../types';

export interface ProvidenceStore {
  queue: (() => void)[];
  runTasks: Record<string, number>;
  runTarget: Record<string, { code: string; mira: Mira }>;
  dependency: DependencyManager;
}

const defaultProvidenceStore: ProvidenceStore = {
  queue: [],
  runTasks: {},
  runTarget: {},
  dependency: new DependencyManager(),
};

const ProvidenceContext = createContext<
  React.MutableRefObject<ProvidenceStore>
>({
  current: defaultProvidenceStore,
});

export const useProvidenceRef = () => useContext(ProvidenceContext);

export const useProvidenceContext = () => {
  const providenceRef = useRef<ProvidenceStore>(defaultProvidenceStore);

  const ProvidenceProvider: React.FC = ({ children }) => (
    <ProvidenceContext.Provider value={providenceRef}>
      {children}
    </ProvidenceContext.Provider>
  );

  return { ProvidenceProvider };
};
