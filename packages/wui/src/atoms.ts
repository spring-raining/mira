import { atom } from 'recoil';

export interface ASTNode {
  id: string;
  [field: string]: any;
}

type AsteroidId = string;
export interface Asteroid {
  id: AsteroidId;
}

interface BrickState {
  brickId: string;
  text: string;
  children?: ASTNode[] | null;
}
export type MarkdownBrick = BrickState & {
  noteType: 'markdown';
};
export type ScriptBrick = BrickState & {
  noteType: 'script';
};
export type AsteroidBrick = BrickState & {
  noteType: 'asteroid';
  asteroid: Asteroid;
};
export type Brick = MarkdownBrick | ScriptBrick | AsteroidBrick;

export const brickDictState = atom<Record<string, Brick>>({
  key: 'brickDictState',
  default: {},
});

export const brickOrderState = atom<string[]>({
  key: 'brickOrderState',
  default: [],
});

export const asteroidDeclaredValueDictState = atom<Record<string, unknown>>({
  key: 'asteroidDeclaredValueDictState',
  default: {},
});

export const asteroidValuesExportedState = atom<Record<AsteroidId, string[]>>({
  key: 'asteroidValuesExportedState',
  default: {},
});

export const asteroidValuesUsedState = atom<Record<string, AsteroidId[]>>({
  key: 'asteroidValuesUsedState',
  default: {},
});
