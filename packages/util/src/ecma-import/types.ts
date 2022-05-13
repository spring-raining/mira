export interface ImportSpecifier {
  readonly n: string | undefined;
  readonly s: number;
  readonly e: number;
  readonly ss: number;
  readonly se: number;
  readonly d: number;
}

export interface ImportDefinition {
  specifier: string;
  all: boolean;
  default: boolean;
  namespace: boolean;
  named: string[];
  importBinding: { [key: string]: string };
  namespaceImport: string | null;
}
