import type { Node } from 'unist';

export type { Node };

export type MiraNode = Node & {
  mira: {
    id: string | number;
    metaString?: string;
    defaultExportNode?: Node;
  };
};
