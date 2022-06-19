import { ImportDefinition } from '../es-module/types';
import { TransformFailure, TransformSuccess } from '../types';

export interface SnippetData {
  transformedCode: string;
  importDefs: readonly ImportDefinition[];
  exportValues: Set<string>;
  dependentValues: Set<string>;
  dependentModuleSpecifiers: Set<string>;
  hasDefaultExport: boolean;
  defaultFunctionParams: readonly string[] | null;
}

export interface ModuleImportData {
  importDefs: readonly ImportDefinition[];
  exportValues: Set<string>;
}

export interface DependencyUpdateEventData<ID extends string> {
  id: ID;
  transform?: TransformSuccess | TransformFailure;
  snippet?: SnippetData;
  source?: string;
}

export interface ModuleUpdateEventData<ID extends string> {
  id: ID;
  module?: ModuleImportData;
  error?: Error | undefined;
}

export interface RenderParamsUpdateEventData<ID extends string> {
  id: ID;
}

export interface SourceRevokeEventData<ID extends string> {
  id: ID;
  source: string;
}
