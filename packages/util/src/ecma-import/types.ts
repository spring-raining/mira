export type { ImportSpecifier } from 'es-module-lexer';

export interface ImportDefinition {
  specifier: string;
  all: boolean;
  default: boolean;
  namespace: boolean;
  named: string[];
  importBinding: { [key: string]: string };
  namespaceImport: string | null;
}
