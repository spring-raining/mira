import { ServiceOptions } from '@mirajs/transpiler';
import clsx from 'clsx';
import React, { useEffect, useMemo } from 'react';
import { RecoilRoot } from 'recoil';
import { HistoryObserver } from '../hooks/useHistory';
import { ProvidenceObserver } from '../hooks/useProvidence';
import {
  RootContainerQueryProvider,
  useRootContainerQuery,
} from '../hooks/useRootContainerQuery';
import { hydrateMdx } from '../mdx/io';
import { wuiConfigState } from '../state/atoms';
import { useBricks } from '../state/brick';
import { useConfig } from '../state/config';
import { MiraWuiConfig } from '../types';
import { noop, noopAsync } from '../util';
import { EditorLoaderConfig } from './Editor';
import * as style from './Universe.css';
import { Block } from './main/Block';
import { PlanetarySystem } from './planetarySystem';

export interface UniverseProps {
  mdx?: string;
  path?: string;
  depsRootPath?: string;
  moduleLoader?: (specifier: string) => Promise<any>;
  onUpdate?: (mdx: string) => void;
  transpilerConfig?: ServiceOptions;
  editorLoaderConfig?: EditorLoaderConfig;
  config: MiraWuiConfig;
}

const UniverseView: React.VFC<UniverseProps> = ({
  mdx: initialMdx,
  onUpdate = noop,
  transpilerConfig,
  editorLoaderConfig,
}) => {
  const { bricks, importBricks, resetActiveBrick } = useBricks({
    onUpdateMdx: onUpdate,
  });
  const config = useConfig();
  const rootContainerQuery = useRootContainerQuery();
  const displayColumnClass = useMemo(
    () =>
      config.layout === 'oneColumn'
        ? style.displayColumn.oneColumn
        : config.layout === 'twoColumn'
        ? style.displayColumn.twoColumn
        : rootContainerQuery.md || rootContainerQuery.sm
        ? style.displayColumn.oneColumn
        : style.displayColumn.twoColumn,
    [config, rootContainerQuery],
  );

  // const history = useHistory();

  useEffect(() => {
    (async () => {
      if (initialMdx) {
        const initialBricks = hydrateMdx(initialMdx);
        console.log(initialBricks);
        importBricks(initialBricks);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cb = () => {
      resetActiveBrick();
    };
    window.addEventListener('click', cb);
    return () => window.removeEventListener('click', cb);
  }, [resetActiveBrick]);

  return (
    <div className={clsx(style.universeContainer, displayColumnClass)}>
      <main className={style.mainPane}>
        <div className={style.mainSticky}>
          {bricks.map((brick) => (
            <Block
              key={brick.id}
              {...{ transpilerConfig, editorLoaderConfig }}
              {...brick}
            />
          ))}
        </div>
      </main>
      <aside className={style.planetarySystemPane}>
        <div className={style.planetarySystemSticky}>
          <PlanetarySystem />
        </div>
      </aside>
    </div>
  );
};

export const Universe: React.VFC<UniverseProps> = ({
  path = '/',
  depsRootPath = '/_mira',
  moduleLoader = noopAsync,
  config,
  ...other
}) => {
  const _config = config || {};
  if (!_config.runtime) {
    throw new Error('Missing required config: runtime');
  }
  return (
    <RecoilRoot
      initializeState={({ set }) => {
        set(wuiConfigState, config);
      }}
    >
      <HistoryObserver />
      <ProvidenceObserver
        {...{ mdxPath: path, depsRootPath, moduleLoader, config }}
        {...other}
      />
      <RootContainerQueryProvider>
        <UniverseView
          {...{ path, depsRootPath, moduleLoader, config }}
          {...other}
        />
      </RootContainerQueryProvider>
    </RecoilRoot>
  );
};
