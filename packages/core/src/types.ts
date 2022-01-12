export interface MiraConfig {
  framework?: 'react';
  module?: string[];
}

export interface RuntimeScope {
  $def: (exportVal: Record<string, any>) => void;
  $use: (name: string, path: string) => any;
  $render: (element: any, onErrorCaptured: (error: Error) => void) => any;
  $jsxFactory: (...args: any[]) => any;
  $jsxFragmentFactory: (...args: any[]) => any;
}

export type RuntimeScopeFactory<CustomRuntimeScope = object> = (arg: {
  scopeVal: Record<string, unknown>;
  lang?: string | undefined;
  meta?: string | undefined;
}) => RuntimeScope & CustomRuntimeScope;

export interface RuntimeEnvironment<CustomRuntimeScope = object> {
  exportVal: Record<string, unknown>;
  referenceVal: Record<string, unknown>;
  getRuntimeScope: RuntimeScopeFactory<CustomRuntimeScope>;
}

export type RuntimeEnvironmentFactory<
  RuntimeEnvironmentConfig = unknown,
  CustomRuntimeScope = object,
> = (arg?: {
  config?: RuntimeEnvironmentConfig;
}) => RuntimeEnvironment<CustomRuntimeScope>;
