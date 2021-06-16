import { styled } from '@linaria/react';
import { ServiceOptions } from '@mirajs/transpiler';
import React, { useCallback, useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { useUniverseContext, RefreshModuleEvent } from './context';
import { useBricks, createNewBrick } from './state/brick';
import { useDependency } from './state/dependency';
import { EditorLoaderConfig } from './components/Editor';
import { PlanetarySystem } from './components/planetarySystem';
import { Block } from './components/workspace/Block';
import { hydrateMdx } from './mdx/io';
import { moduleLoader as defaultModuleLoader } from './mdx/dependency';

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
  path = '/',
  depsRootPath = '/_mira',
  moduleLoader = defaultModuleLoader,
  onUpdate = () => {},
  transpilerConfig,
  editorLoaderConfig,
}) => {
  const { bricks, pushBrick, importBricks, resetActiveBrick } = useBricks({
    onUpdateMdx: onUpdate,
  });
  const { loadDependency, refreshDependency } = useDependency({
    path,
    depsRootPath,
    moduleLoader,
  });
  const {
    addRefreshModuleListener,
    removeRefreshModuleListener,
  } = useUniverseContext();
  const onCreateCodeBlockClick = useCallback(() => {
    pushBrick(createNewBrick({ language: 'jsx', isLived: true }));
  }, [pushBrick]);
  const onCreateTextBlockClick = useCallback(() => {
    pushBrick(createNewBrick({ language: 'markdown' }));
  }, [pushBrick]);

  useEffect(() => {
    const refreshModule = (event: RefreshModuleEvent) => {
      refreshDependency(event);
    };

    (async () => {
      if (initialMdx) {
        const initialBricks = hydrateMdx(initialMdx);
        console.log(initialBricks);
        await loadDependency(initialBricks);
        importBricks(initialBricks);
        addRefreshModuleListener(refreshModule);
      }
    })();
    return () => {
      removeRefreshModuleListener(refreshModule);
    };
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
              key={brick.brickId}
              {...{ transpilerConfig, editorLoaderConfig }}
              {...brick}
            />
          ))}
          <button onClick={onCreateCodeBlockClick}>Create code block</button>
          <button onClick={onCreateTextBlockClick}>Create text block</button>
        </MainSticky>
      </MainPane>
    </UniverseContainer>
  );
};

export const Universe: React.VFC<UniverseProps> = (props) => {
  return (
    <RecoilRoot>
      <UniverseView {...props} />
    </RecoilRoot>
  );
};
