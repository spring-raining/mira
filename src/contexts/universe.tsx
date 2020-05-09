import { createContext } from 'react';
import { MarkdownNote, ScriptNote, AsteroidNote } from '../remark/importMdx';

type Brick =
  | (Omit<MarkdownNote, 'children'> & { key: string })
  | (Omit<ScriptNote, 'children'> & { key: string })
  | (Omit<AsteroidNote, 'children'> & { key: string });

export type CodeBlockStatus = 'init' | 'live' | 'outdated' | 'running';

export interface Asteroid {
  result: object | null;
  status: CodeBlockStatus;
  scope: object;
  stepNo?: number;
}

export interface Providence {
  asteroid: { [id: string]: Asteroid };
  asteroidOrder: string[];
}

export interface UniverseContextState {
  bricks: Brick[];
  providence: Providence;
}

export type UniverseContextAction = Partial<UniverseContextState>;

export const UniverseContext = createContext<{
  state: UniverseContextState;
  dispatch: (action: UniverseContextAction) => void;
}>({} as any);

export const universeContextInitialState: UniverseContextState = {
  bricks: [],
  providence: {
    asteroid: {},
    asteroidOrder: [],
  },
};

export const universeContextReducer = (
  state: UniverseContextState,
  action: UniverseContextAction
): UniverseContextState => {
  const newState = {
    ...state,
    ...action,
  };
  return newState;
};
