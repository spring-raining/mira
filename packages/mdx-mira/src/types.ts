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
