import type { Framework } from '@mirajs/util';
import { loadModule, resolveImportSpecifier } from '../mdx/imports';
import { RuntimeEnvironment } from '../types';
import { genRunEnvId } from './../util';

export type Runtime = { getRuntimeEnvironment: () => RuntimeEnvironment };

export const setupRuntime = async ({
  framework,
  moduleLoader,
  base,
  depsContext,
}: {
  framework: string;
  moduleLoader: (specifier: string) => Promise<unknown>;
  base: string;
  depsContext: string;
}): Promise<Runtime> => {
  const frameworkSpecifier = resolveImportSpecifier({
    specifier: framework,
    base,
    depsContext,
  });
  const frameworkModule = await loadModule<Framework>({
    specifier: frameworkSpecifier,
    moduleLoader,
  });
  const { getRuntimeScope } = frameworkModule.runtime();

  return {
    getRuntimeEnvironment: () => ({
      envId: genRunEnvId(),
      getRuntimeScope,
    }),
  };
};
