import React, { createContext, useContext } from 'react';
import { ContainerQuery } from 'react-container-query';

const rootContainerQuery = {
  md: {
    minWidth: 768,
    maxWidth: 1023,
  },
  sm: {
    maxWidth: 767,
  },
};

type ContextType = Record<keyof typeof rootContainerQuery, boolean>;
const rootContainerQueryContext = createContext<ContextType>({
  md: false,
  sm: false,
});

export const RootContainerQueryProvider: React.FC = ({ children }) => {
  return (
    <ContainerQuery query={rootContainerQuery}>
      {(value) => (
        <rootContainerQueryContext.Provider
          {...{ value: value as ContextType }}
        >
          {children}
        </rootContainerQueryContext.Provider>
      )}
    </ContainerQuery>
  );
};

export const useRootContainerQuery = () => {
  const rootContainerQuery = useContext(rootContainerQueryContext);
  return rootContainerQuery;
};
