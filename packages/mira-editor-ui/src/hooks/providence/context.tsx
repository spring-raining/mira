import React, { createContext, useContext, useRef } from 'react';
import { DependencyManager } from '../../live/dependency';
import { BrickId, EvaluatedResult, Mira } from '../../types';

export interface ProvidenceStore {
  queue: (() => void)[];
  runTasks: Record<BrickId, [number, Promise<EvaluatedResult>]>;
  runTarget: Record<BrickId, { code: string; mira: Mira }>;
  dependency?: DependencyManager<BrickId> | undefined;
}

const defaultProvidenceStore: ProvidenceStore = {
  queue: [],
  runTasks: {},
  runTarget: {},
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
