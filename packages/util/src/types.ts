export interface MiraConfig {
  framework?: string;
  module?: string[];
}

export interface Framework {
  runtime: RuntimeEnvironmentFactory;
  MiraEval?: MiraEvalBase;
  viteConfig?: {
    optimizeDeps?: {
      entries?: string[];
      include?: string[];
      exclude?: string[];
      extensions?: string[];
    };
  };
}

export interface RuntimeScope {
  $mount: (element: any, container: Element) => void;
  $unmount: (element: any, container: Element) => void;
  $jsxFactory: (...args: any[]) => any;
  $jsxFragmentFactory: (...args: any[]) => any;
}

export type RuntimeScopeFactory<CustomRuntimeScope = object> = (arg: {
  lang?: string | undefined;
  meta?: string | undefined;
}) => RuntimeScope & CustomRuntimeScope;

export interface RuntimeEnvironment<CustomRuntimeScope = object> {
  getRuntimeScope: RuntimeScopeFactory<CustomRuntimeScope>;
}

export type RuntimeEnvironmentFactory<
  RuntimeEnvironmentConfig = unknown,
  CustomRuntimeScope = object,
> = (arg?: {
  config?: RuntimeEnvironmentConfig;
}) => RuntimeEnvironment<CustomRuntimeScope>;

export abstract class MiraEvalBase extends HTMLElement {
  props: any;

  abstract evaluateCode(
    code: string,
    scopeVal: Map<string, any>,
  ): Promise<void>;

  abstract loadScript(source: string): Promise<void>;
}

export interface MessageLocation {
  /** 1-based */
  line: number;
  /** 0-based, in bytes */
  column: number;
  /** in bytes */
  length: number;
  file?: string | null;
  namespace?: string | null;
  lineText?: string | null;
  suggestion?: string | null;
}

export interface Message {
  text: string;
  location?: MessageLocation | null;
  pluginName?: string | null;
  detail?: any;
}

export interface BuildOutputFile {
  path: string;
  contents: Uint8Array;
  text: string;
}

export interface BuildResult {
  result: BuildOutputFile[];
  errorObject?: undefined;
  errors: Message[];
  warnings: Message[];
}

export interface BuildFailure {
  result?: undefined;
  errorObject: Error;
  errors: Message[];
  warnings: Message[];
}

export interface TransformResult {
  result: {
    code: string;
    map?: string | null;
  };
  errorObject?: undefined;
  errors: Message[];
  warnings: Message[];
}

export interface TransformFailure {
  result?: undefined;
  errorObject: Error;
  errors: Message[];
  warnings: Message[];
}

export abstract class MiraTranspilerBase<
  InitOptions = object,
  BuildOptions = object,
  TransformOptions = object,
> {
  abstract get isInitialized(): boolean;
  abstract init(options: InitOptions): Promise<void>;
  abstract build(options: BuildOptions): Promise<BuildResult | BuildFailure>;
  abstract transform(
    input: string,
    options?: TransformOptions,
  ): Promise<TransformResult | TransformFailure>;
}
