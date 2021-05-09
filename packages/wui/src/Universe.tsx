import { css } from 'lightwindcss';
import React, { useCallback, useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { Brick } from './types';
import { useBricks, createNewBrick } from './state/brick';
import { Block } from './Universe/Block';

export interface UniverseProps {
  bricks?: Brick[];
}

const UniverseView: React.VFC<UniverseProps> = ({ bricks: initialBricks }) => {
  const { bricks, pushBrick, importBricks } = useBricks();
  const onCreateCodeBlockClick = useCallback(() => {
    pushBrick(createNewBrick({ language: 'jsx', isLived: true }));
  }, [pushBrick]);
  const onCreateTextBlockClick = useCallback(() => {
    pushBrick(createNewBrick({ language: 'markdown' }));
  }, [pushBrick]);

  useEffect(() => {
    if (initialBricks) {
      console.log(initialBricks);
      importBricks(initialBricks);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={css`
        width: 100%;
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
  );
};

export const Universe: React.VFC<UniverseProps> = (props) => {
  return (
    <RecoilRoot>
      <UniverseView {...props} />
    </RecoilRoot>
  );
};
