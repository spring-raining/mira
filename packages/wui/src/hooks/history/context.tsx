import React, { createContext, useContext, useRef } from 'react';
import { Snapshot } from 'recoil';

interface HistoryStep {
  snapshot: Snapshot;
  release: () => void;
}

export interface HistoryStore {
  stack: HistoryStep[];
  depth: number;
}
const defaultHistoryStore: HistoryStore = {
  stack: [],
  depth: 0,
};

const HistoryContext = createContext<React.MutableRefObject<HistoryStore>>({
  current: defaultHistoryStore,
});

export const useHistoryRef = () => useContext(HistoryContext);

export const useHistoryContext = () => {
  const historyRef = useRef<HistoryStore>(defaultHistoryStore);

  const HistoryProvider: React.FC = ({ children }) => (
    <HistoryContext.Provider value={historyRef}>
      {children}
    </HistoryContext.Provider>
  );

  return {
    HistoryProvider,
  };
};
