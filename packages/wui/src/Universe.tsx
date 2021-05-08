import { css } from 'lightwindcss';
import React, { useCallback, useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { Brick } from './atoms';
import { useBricks, createNewBrick } from './hooks/brick';
import { Block } from './Universe/Block';
import { LiveBlock } from './Universe/LiveBlock';

export interface UniverseProps {
  bricks?: Brick[];
}

const UniverseView: React.VFC<UniverseProps> = ({ bricks: initialBricks }) => {
  const { bricks, pushBrick, importBricks } = useBricks();
  const onCreateCodeBlockClick = useCallback(() => {
    pushBrick(createNewBrick('asteroid'));
  }, [pushBrick]);
  const onCreateTextBlockClick = useCallback(() => {
    pushBrick(createNewBrick('script'));
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
        if (brick.noteType === 'asteroid') {
          return <LiveBlock key={brick.brickId} {...brick} />;
        } else if (brick.noteType === 'markdown') {
          return <Block key={brick.brickId} {...brick} />
        } else {
          return <pre><code>{brick.text}</code></pre>
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
