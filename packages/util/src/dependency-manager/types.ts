import { ImportDefinition } from '../ecma-import/types';

export interface SnippetData {
  transformedCode: string;
  importDefs: readonly ImportDefinition[];
  exportValues: Set<string>;
  dependentValues: Set<string>;
  hasDefaultExport: boolean;
  defaultFunctionParams: readonly string[] | null;
}
