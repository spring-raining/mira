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
