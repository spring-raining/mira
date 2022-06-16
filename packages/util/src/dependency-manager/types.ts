import { ImportDefinition } from '../ecma-import/types';
import { TransformFailure, TransformSuccess } from '../types';

export interface SnippetData {
  transformedCode: string;
  importDefs: readonly ImportDefinition[];
  exportValues: Set<string>;
  dependentValues: Set<string>;
  hasDefaultExport: boolean;
  defaultFunctionParams: readonly string[] | null;
}

export interface DependencyUpdateEventData<ID extends string> {
  id: ID;
  transform: TransformSuccess | TransformFailure;
  snippet?: SnippetData;
  source?: string;
}

export interface RenderParamsUpdateEventData<ID extends string> {
  id: ID;
}

export interface SourceRevokeEventData<ID extends string> {
  id: ID;
  source: string;
}
