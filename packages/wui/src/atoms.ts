import { atom } from 'recoil';

export type Either<Left, Right> = [null, Right] | [Left, null];

export interface ASTNode {
  id: string;
  [field: string]: any;
}

interface BrickState {
  brickId: string;
  text: string;
  children?: ASTNode[] | null;
}
type MarkdownBrick = BrickState & {
  noteType: 'markdown';
};
type ScriptBrick = BrickState & {
  noteType: 'script';
};
type AsteroidBrick = BrickState & {
  noteType: 'asteroid';
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

