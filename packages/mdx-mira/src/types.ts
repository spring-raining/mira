import { Node } from 'unist';

export type { Node };

export type MiraNode = Node & {
  mira: {
    id: string | number;
    metaString?: string;
    defaultExportNode?: Node;
  };
};

export interface ImportDefinition {
  specifier: string;
  all: boolean;
  default: boolean;
  namespace: boolean;
  named: string[];
  importBinding: { [key: string]: string };
  namespaceImport: string | null;
}

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
  warnings: MarkerMessage[];
  errors: MarkerMessage[];
  errorObject?: Error;
}
