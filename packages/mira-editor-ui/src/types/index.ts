import {
  RuntimeEnvironment as CoreRuntimeEnvironment,
  Message,
  ImportDefinition,
  DependencyUpdateEventData,
} from '@mirajs/util';
import { Update } from 'vite';

export type KeyActions = 'UNDO' | 'REDO';
export type KeySequence = string | Array<string>;
export type KeyMap = { [k in KeyActions]: KeySequence };

export type MiraWuiConfig = {
  base: string;
  depsContext: string;
  framework: string;
  inputDebounce?: number;
  layout?: 'oneColumn' | 'twoColumn';
  keyMap?: Partial<KeyMap>;
};

export type CodeEditorData = {
  state: {
    doc: string;
    selection: any;
    [field: string]: any;
  };
};

export type ParsedImportStatement = ImportDefinition & {
  statement: string;
};

export interface ASTNode {
  [field: string]: any;
}

export type MiraId = `mira.${string}`;
export interface Mira {
  id: MiraId;
  isLived: boolean;
}

export type BrickId = `brick.${string}`;
export interface BrickState {
  id: BrickId;
  text: string;
  ast?: ASTNode[];
  codeEditor: CodeEditorData;
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

export type LiteralBrickData = {
  codeEditor: CodeEditorData;
  mira?: Mira;
};

export type EnvironmentId = `env.${string}`;
export interface RuntimeEnvironment extends CoreRuntimeEnvironment {
  envId: EnvironmentId;
}

export interface EvaluatedResult {
  id: MiraId;
  environment: RuntimeEnvironment;
  hasDefaultExport: boolean;
  // code?: string;
  source?: string;
  error?: Error;
  errorMarkers?: Message[];
  warnMarkers?: Message[];
}

export interface EvaluateState {
  id: MiraId;
  result: Promise<EvaluatedResult>;
}

export type ModuleImportDefinition = {
  mappedName: readonly string[];
  importDefinition: readonly ImportDefinition[];
};

export type ModuleImportMapping = {
  specifier: string;
  url: string;
  name: string | null;
};

// export type ModuleImportInfo<ID extends string> = {
//   importMapping: Record<string, ModuleImportMapping>;
//   importDef: Record<ID, ModuleImportDefinition>;
//   importError: Record<ID, Error>;
// };

export type DependencyUpdateInfo<ID extends string> =
  DependencyUpdateEventData<ID>;

export type RenderParamsUpdateInfo<ID extends string> = {
  id: ID;
  params: Map<string, unknown>;
};

export interface RefreshModuleEvent {
  module: unknown;
  viteUpdate: Update;
  url: string;
}

export type CalleeId = `fn.${string}`;
