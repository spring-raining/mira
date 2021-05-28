import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';

export interface RefreshModuleEvent {
  module: any;
  url: string;
  bubbled: boolean;
}

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

const useHmr = () => {
  const [hmrMessageQueue, setHmrMessageQueue] = useState<RefreshModuleEvent[]>(
    []
  );
  const hmrCallbacks = useRef<((message: RefreshModuleEvent) => void)[]>([]);

  const refreshModule = useCallback((message: RefreshModuleEvent) => {
    setHmrMessageQueue((val) => [...val, message]);
  }, []);
  const addRefreshModuleListener = useCallback(
    (fn: (message: RefreshModuleEvent) => void) => {
      hmrCallbacks.current.push(fn);
    },
    []
  );
  const removeRefreshModuleListener = useCallback(
    (fn: (message: RefreshModuleEvent) => void) => {
      hmrCallbacks.current = hmrCallbacks.current.filter((f) => f !== fn);
    },
    []
  );

  useEffect(() => {
    if (hmrMessageQueue.length === 0) {
      return;
    }
    const message = hmrMessageQueue[0];
    setHmrMessageQueue(hmrMessageQueue.slice(1));
    [...hmrCallbacks.current].forEach((fn) => {
      fn(message);
    });
  }, [hmrMessageQueue]);

  return {
    refreshModule,
    addRefreshModuleListener,
    removeRefreshModuleListener,
  };
};

export const UniverseProvider: React.FC = ({ children }) => {
  const hmrProvider = useHmr();

  return (
    <universeContext.Provider value={{ ...hmrProvider }}>
      {children}
    </universeContext.Provider>
  );
};
