import { ServiceOptions } from '@mirajs/transpiler';
import React, { useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import * as style from './Universe.css';
import { EditorLoaderConfig } from './components/Editor';
import { PlanetarySystem } from './components/planetarySystem';
import { Block } from './components/workspace/Block';
import { HistoryObserver } from './hooks/useHistory';
import { ProvidenceObserver } from './hooks/useProvidence';
import { hydrateMdx } from './mdx/io';
import { useBricks } from './state/brick';
import { noop, noopAsync } from './util';

export interface UniverseProps {
  mdx?: string;
  path?: string;
  depsRootPath?: string;
  moduleLoader?: (specifier: string) => Promise<any>;
  onUpdate?: (mdx: string) => void;
  transpilerConfig?: ServiceOptions;
  editorLoaderConfig?: EditorLoaderConfig;
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
    <div className={style.universeContainer}>
      <div className={style.planetarySystemPane}>
        <div className={style.planetarySystemSticky}>
          <PlanetarySystem />
        </div>
      </div>
      <div className={style.mainPane}>
        <div className={style.mainSticky}>
          {bricks.map((brick) => (
            <Block
              key={brick.id}
              {...{ transpilerConfig, editorLoaderConfig }}
              {...brick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const Universe: React.VFC<UniverseProps> = ({
  path = '/',
  depsRootPath = '/_mira',
  moduleLoader = noopAsync,
  ...other
}) => {
  return (
    <RecoilRoot>
      <HistoryObserver />
      <ProvidenceObserver
        {...{ mdxPath: path, depsRootPath, moduleLoader }}
        {...other}
      />
      <UniverseView {...{ path, depsRootPath, moduleLoader }} {...other} />
    </RecoilRoot>
  );
};
