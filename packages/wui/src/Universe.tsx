import { css } from 'lightwindcss';
import React, { useCallback, useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { useBricks, createNewBrick } from './state/brick';
import { PlanetarySystem } from './components/planetarySystem';
import { Block } from './components/workspace/Block';
import { hydrateMdx } from './mdx/io';
import {
  collectImports,
  loadModule,
  moduleLoader as defaultModuleLoader,
} from './mdx/dependency';

export interface UniverseProps {
  mdx?: string;
  path?: string;
  depsRootPath?: string;
  moduleLoader?: (specifier: string) => Promise<any>;
  onUpdate?: (mdx: string) => void;
}

const UniverseView: React.VFC<UniverseProps> = ({
  mdx: initialMdx,
  path = '/',
  depsRootPath = '/_asteroid',
  moduleLoader = defaultModuleLoader,
  onUpdate = () => {},
}) => {
  const { bricks, pushBrick, importBricks, resetActiveBrick } = useBricks({
    onUpdateMdx: onUpdate,
  });
  const onCreateCodeBlockClick = useCallback(() => {
    pushBrick(createNewBrick({ language: 'jsx', isLived: true }));
  }, [pushBrick]);
  const onCreateTextBlockClick = useCallback(() => {
    pushBrick(createNewBrick({ language: 'markdown' }));
  }, [pushBrick]);

  useEffect(() => {
    (async () => {
      if (initialMdx) {
        const initialBricks = hydrateMdx(initialMdx);
        console.log(initialBricks);
        const importDefs = await collectImports({
          bricks: initialBricks,
          path,
          depsRootPath,
        });
        console.log(importDefs);
        const modules = await loadModule(importDefs, moduleLoader);
        console.log(modules);
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
    <div
      className={css`
        display: flex;
      `}
    >
      <div
        className={css`
          width: 10rem;
        `}
      >
        <div
          className={css`
            top: 0;
            position: sticky;
            padding: 5rem 0;
          `}
        >
          <PlanetarySystem />
        </div>
      </div>
      <div
        className={css`
          flex: 1;
        `}
      >
        <div
          className={css`
            width: '100%';
            position: sticky;
            top: 0;
            padding: 5rem 0;
            margin-inline-start: 1.5rem;
          `}
        >
          {bricks.map((brick) => {
            if (brick.noteType === 'script') {
              return (
                <pre key={brick.brickId}>
                  <code>{brick.text}</code>
                </pre>
              );
            } else {
              return <Block key={brick.brickId} {...brick} />;
            }
          })}
          <button onClick={onCreateCodeBlockClick}>Create code block</button>
          <button onClick={onCreateTextBlockClick}>Create text block</button>
        </div>
      </div>
    </div>
  );
};

export const Universe: React.VFC<UniverseProps> = (props) => {
  return (
    <RecoilRoot>
      <UniverseView {...props} />
    </RecoilRoot>
  );
};
