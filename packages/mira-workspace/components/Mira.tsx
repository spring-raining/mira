import {
  MiraWui,
  useUniverseContext,
  RefreshModuleEvent,
} from '@mirajs/mira-editor-ui';
import React, { useCallback, useEffect } from 'react';
import { WorkspaceRepository } from '../services/workspace/workspace.trait';
import { MiraMdxFileItem } from '../types/workspace';
import { noop } from '../util';

export const Mira: React.VFC<{
  file: MiraMdxFileItem | undefined;
  mdx: string | undefined;
  constants: WorkspaceRepository['constants'];
  onUpdate?: (mdx: string) => void;
}> = ({
  file,
  mdx,
  constants: { base, depsContext, frameworkUrl, hmrUpdateEventName },
  onUpdate = noop,
}) => {
  const moduleLoader = useCallback(async (specifier: string) => {
    const mod = await import(/* webpackIgnore: true */ specifier);
    return mod;
  }, []);
  const { refreshModule } = useUniverseContext();
  useEffect(() => {
    if (!hmrUpdateEventName) {
      return;
    }
    const fn = (event: CustomEvent<RefreshModuleEvent>) => {
      refreshModule(event.detail);
    };
    window.addEventListener(hmrUpdateEventName, fn as EventListener);
    return () =>
      window.removeEventListener(hmrUpdateEventName, fn as EventListener);
  }, [refreshModule, hmrUpdateEventName]);

  return (
    <MiraWui
      mdx={mdx}
      path={file?.path}
      onUpdate={onUpdate}
      moduleLoader={moduleLoader}
      config={{
        base,
        depsContext,
        framework: frameworkUrl,
      }}
    />
  );
};
