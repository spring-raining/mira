import { createContext } from 'react';
import { MarkdownNote, ScriptNote, AsteroidNote, ASTNode } from '../mdx';

interface BrickState {
  brickId: string;
  children?: ASTNode[];
}

export type MarkdownBrick = Omit<MarkdownNote, 'children'> & BrickState;
export type ScriptBrick = Omit<ScriptNote, 'children'> & BrickState;
export type AsteroidBrick = Omit<AsteroidNote, 'children'> & BrickState;
type Brick = MarkdownBrick | ScriptBrick | AsteroidBrick;

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
  modules: { [name: string]: any };
}

export interface UniverseContextState {
  bricks: Brick[];
  providence: Providence;
  activeBrick: string | null;
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
    modules: {},
  },
  activeBrick: null,
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
