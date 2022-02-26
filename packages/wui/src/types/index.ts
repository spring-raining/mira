import { RuntimeEnvironment as CoreRuntimeEnvironment } from '@mirajs/core';
import { ImportDefinition } from '@mirajs/core/lib/ecmaImport';
import { Update } from 'vite';

export type { ImportDefinition };

export type MiraWuiConfig = {
  runtime: string;
  inputDebounce?: number;
  layout?: 'oneColumn' | 'twoColumn';
};

export type ParsedImportStatement = ImportDefinition & {
  statement: string;
};

export interface ASTNode {
  id: string;
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

export type LiteralBrickData = {
  text: string;
  mira?: Mira;
};

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

export type EnvironmentId = `env.${string}`;
export interface RuntimeEnvironment extends CoreRuntimeEnvironment {
  envId: EnvironmentId;
}

export interface EvaluatedResult {
  id: MiraId;
  environment: RuntimeEnvironment;
  hasDefaultExport: boolean;
  code?: string;
  source?: string;
  error?: Error;
  errorMarkers?: MarkerMessage[];
  warnMarkers?: MarkerMessage[];
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

export type ModuleImportInfo<ID extends string> = {
  importMapping: Record<string, ModuleImportMapping>;
  importDef: Record<ID, ModuleImportDefinition>;
  importError: Record<ID, Error>;
};

export type DependencyUpdateInfo<ID extends string> = {
  id: ID;
  resolvedValues: readonly [string, string[]][];
  importDefinitions: readonly ImportDefinition[];
  dependencyError: Error | undefined;
};

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
