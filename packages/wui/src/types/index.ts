import { ImportDefinition } from '@mirajs/core/lib/ecmaImport';

export type ParsedImportStatement = ImportDefinition & {
  statement: string;
};

export interface ASTNode {
  id: string;
  [field: string]: any;
}

export type MiraId = string;
export interface Mira {
  id: MiraId;
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
  mira?: Mira;
};
export type ScriptBrick = BrickState & {
  noteType: 'script';
};
export type Brick = ContentBrick | ScriptBrick;
