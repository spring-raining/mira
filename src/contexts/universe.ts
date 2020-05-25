import { createContext } from 'react';
import { nanoid } from 'nanoid';
import { MarkdownNote, ScriptNote, AsteroidNote, ASTNode } from '../mdx';

interface BrickState {
  brickId: string;
  children?: ASTNode[] | null;
}

export type MarkdownBrick = Omit<MarkdownNote, 'children'> & BrickState;
export type ScriptBrick = Omit<ScriptNote, 'children'> & BrickState;
export type AsteroidBrick = Omit<AsteroidNote, 'children'> & BrickState;
export type Brick = MarkdownBrick | ScriptBrick | AsteroidBrick;

export type CodeBlockStatus = 'init' | 'live' | 'outdated' | 'running';

export interface Asteroid {
  result: object | null;
  status: CodeBlockStatus;
  scope: object;
  stepNo?: number;
}

export interface ImportDefinition {
  moduleSpecifier: string;
  importBinding: { [key: string]: string };
  namespaceImport: string | null;
}

export interface ImportPart {
  id: string;
  text: string;
  definitions: ImportDefinition[];
  modules?: { [name: string]: any };
  importError?: Error;
}

export interface Providence {
  asteroid: { [id: string]: Asteroid };
  asteroidOrder: string[];
  imports: ImportPart[];
}

export interface UniverseContextState {
  bricks: Brick[];
  providence: Providence;
  userScript: Omit<ScriptBrick, 'text'>;
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
    imports: [],
  },
  userScript: {
    noteType: 'script',
    brickId: nanoid(),
    children: [],
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
