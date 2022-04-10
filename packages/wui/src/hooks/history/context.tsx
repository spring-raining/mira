import React, { createContext, useContext, useRef } from 'react';
import { Snapshot, SnapshotID } from 'recoil';

interface HistoryStep {
  id: number;
  snapshot?: Snapshot;
  release?: () => void;
  next?: HistoryStep;
  prev?: HistoryStep;
}

export interface HistoryStore {
  history: HistoryStep;
  restoreSnapshotId: SnapshotID | null;
  isInRestore: boolean;
  isInCommit: boolean;
}
const defaultHistoryStore: HistoryStore = {
  history: {
    id: 0,
  },
  restoreSnapshotId: null,
  isInRestore: false,
  isInCommit: false,
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
