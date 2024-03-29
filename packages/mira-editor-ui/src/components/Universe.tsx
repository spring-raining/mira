import clsx from 'clsx';
import React, { useEffect, useMemo } from 'react';
import { GlobalHotKeys } from 'react-hotkeys';
import { RecoilRoot } from 'recoil';
import { HistoryObserver } from '../hooks/useHistory';
import { useKeyEvent } from '../hooks/useKeyEvent';
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
import * as style from './Universe.css';
import { ScrollableBlockList } from './main/ScrollableBlockList';
import { PlanetarySystem } from './planetarySystem';

export interface UniverseProps {
  mdx?: string;
  path?: string;
  moduleLoader?: (specifier: string) => Promise<any>;
  onUpdate?: (mdx: string) => void;
  config: MiraWuiConfig;
}

const UniverseView: React.VFC<UniverseProps> = ({
  mdx: initialMdx,
  onUpdate = noop,
}) => {
  const { importBricks, resetActiveBrick } = useBricks({
    onUpdateMdx: onUpdate,
  });
  const config = useConfig();
  const rootContainerQuery = useRootContainerQuery();
  const { keyMap, keyEventHandlers } = useKeyEvent();
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
      <GlobalHotKeys keyMap={keyMap} handlers={keyEventHandlers} />
      <main className={style.mainPane}>
        <div className={style.mainSticky}>
          <ScrollableBlockList onUpdateMdx={onUpdate} />
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
  moduleLoader = noopAsync,
  config,
  ...other
}) => {
  const _config = config || {};
  if (!_config.framework) {
    throw new Error('Missing required config: framework');
  }
  return (
    <RecoilRoot
      initializeState={({ set }) => {
        set(wuiConfigState, config);
      }}
    >
      <HistoryObserver />
      <ProvidenceObserver
        {...{ mdxPath: path, moduleLoader, config }}
        {...other}
      />
      <RootContainerQueryProvider>
        <UniverseView {...{ path, moduleLoader, config }} {...other} />
      </RootContainerQueryProvider>
    </RecoilRoot>
  );
};
