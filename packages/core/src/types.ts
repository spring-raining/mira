export interface MiraConfig {
  framework?: 'react';
  module?: string[];
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
