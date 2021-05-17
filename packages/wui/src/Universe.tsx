import { css } from 'lightwindcss';
import React, { useCallback, useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { useBricks, createNewBrick } from './state/brick';
import { PlanetarySystem } from './components/planetarySystem';
import { Block } from './components/workspace/Block';
import { hydrateMdx, dehydrateBrick } from './mdx/io';

export interface UniverseProps {
  mdx?: string;
  onUpdate?: (mdx: string) => void;
}

const UniverseView: React.VFC<UniverseProps> = ({
  mdx: initialMdx,
  onUpdate = () => {},
}) => {
  const { bricks, pushBrick, importBricks } = useBricks({
    onUpdateMdx: onUpdate,
  });
  const onCreateCodeBlockClick = useCallback(() => {
    pushBrick(createNewBrick({ language: 'jsx', isLived: true }));
  }, [pushBrick]);
  const onCreateTextBlockClick = useCallback(() => {
    pushBrick(createNewBrick({ language: 'markdown' }));
  }, [pushBrick]);

  useEffect(() => {
    if (initialMdx) {
      const initialBricks = hydrateMdx(initialMdx);
      console.log(initialBricks);
      importBricks(initialBricks);
      console.log(initialBricks.map((brick) => dehydrateBrick(brick)));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
