import { ImportDefinition } from '@mirajs/core/lib/ecmaImport';

export type MiraWuiConfig = {
  layout?: 'oneColumn' | 'twoColumn';
};

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

export interface BrickState {
  id: string;
  text: string;
  children?: ASTNode[] | null;
}
export type NoteBrick = BrickState & {
  type: 'note';
};
export type SnippetBrick = BrickState & {
  type: 'snippet';
  language: string;
  mira?: Mira;
};
export type ScriptBrick = BrickState & {
  type: 'script';
};
export type Brick = NoteBrick | SnippetBrick | ScriptBrick;

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

export interface ModuleImportState {
  mappedVal: Record<string, unknown>;
  importDef: Record<string, readonly string[]>;
  importError: Record<string, Error>;
}

export interface RefreshModuleEvent {
  module: unknown;
  url: string;
  bubbled: boolean;
}
