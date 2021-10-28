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

export interface MarkerMessage {
  location: {
    line: number;
    column: number;
    length: number;
  };
  text: string;
}

export interface TranspiledResult {
  text?: string;
  map?: string;
  warnings: MarkerMessage[];
  errors: MarkerMessage[];
  errorObject?: Error;
}

export interface RuntimeScope {
  $run(element: any): void;
  $val(...args: any[]): void;
  $use(val: any): void;
  $jsxFactory: any;
  $jsxFragment: any;
}

export interface RuntimeEnvironment {
  envId: string;
  render: any;
  exportVal: Record<string, any>;
  referenceVal: Record<string, any>;
  getRuntimeScope: (e: { scope: Record<string, unknown> }) => RuntimeScope;
}

export interface EvaluatedResult {
  id: string;
  environment: RuntimeEnvironment;
  error?: Error;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
}
