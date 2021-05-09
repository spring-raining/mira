export interface ASTNode {
  id: string;
  [field: string]: any;
}

export type AsteroidId = string;
export interface Asteroid {
  id: AsteroidId;
  isLived: boolean;
}

interface BrickState {
  brickId: string;
  text: string;
  children?: ASTNode[] | null;
}
export type ContentBrick = BrickState & {
  noteType: 'content';
  language: string;
  asteroid?: Asteroid;
};
export type ScriptBrick = BrickState & {
  noteType: 'script';
};
export type Brick = ContentBrick | ScriptBrick;
