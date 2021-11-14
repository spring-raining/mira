import { styled } from '@linaria/react';
import { ServiceOptions } from '@mirajs/transpiler';
import React, { useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { useHistory, HistoryObserver } from './hooks/useHistory';
import { ProvidenceObserver } from './hooks/useProvidence';
import { useBricks } from './state/brick';
import { EditorLoaderConfig } from './components/Editor';
import { PlanetarySystem } from './components/planetarySystem';
import { Block } from './components/workspace/Block';
import { hydrateMdx } from './mdx/io';

export interface UniverseProps {
  mdx?: string;
  path?: string;
  depsRootPath?: string;
  moduleLoader?: (specifier: string) => Promise<any>;
  onUpdate?: (mdx: string) => void;
  transpilerConfig?: ServiceOptions;
  editorLoaderConfig?: EditorLoaderConfig;
}

const UniverseContainer = styled.div`
  width: 100%;
  display: flex;
`;
const PlanetarySystemPane = styled.div`
  width: 12rem;
`;
const PlanetarySystemSticky = styled.div`
  top: 0;
  position: sticky;
  padding: 70px 0;
`;
const MainPane = styled.div`
  flex: 1;
`;
const MainSticky = styled.div`
  width: '100%';
  position: sticky;
  top: 0;
  padding: 70px 0;
  margin-inline-start: 1rem;
`;

const UniverseView: React.VFC<UniverseProps> = ({
  mdx: initialMdx,
  onUpdate = () => {},
  transpilerConfig,
  editorLoaderConfig,
}) => {
  const { bricks, importBricks, resetActiveBrick } = useBricks({
    onUpdateMdx: onUpdate,
  });

  const history = useHistory();

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
    <UniverseContainer>
      <PlanetarySystemPane>
        <PlanetarySystemSticky>
          <PlanetarySystem />
        </PlanetarySystemSticky>
      </PlanetarySystemPane>
      <MainPane>
        <MainSticky>
          {bricks.map((brick) => (
            <Block
              key={brick.id}
              {...{ transpilerConfig, editorLoaderConfig }}
              {...brick}
            />
          ))}
        </MainSticky>
      </MainPane>
    </UniverseContainer>
  );
};

export const Universe: React.VFC<UniverseProps> = ({
  path = '/',
  depsRootPath = '/_mira',
  moduleLoader = async () => {},
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
