import { css } from 'lightwindcss';
import React, { useCallback } from 'react';
import { RecoilRoot } from 'recoil';
import { useBricks, createNewBrick } from './hooks/brick';
import { Block } from './Universe/Block';
import { LiveBlock } from './Universe/LiveBlock';

const UniverseView: React.FC = () => {
  const { bricks, pushBrick } = useBricks();
  const onCreateCodeBlockClick = useCallback(() => {
    pushBrick(createNewBrick('asteroid'));
  }, [pushBrick]);
  const onCreateTextBlockClick = useCallback(() => {
    pushBrick(createNewBrick('script'));
  }, [pushBrick]);

  return (
    <div
      className={css`
        width: 100%;
      `}
    >
      {bricks.map((brick) => {
        if (brick.noteType === 'asteroid') {
          return <LiveBlock key={brick.brickId} {...brick} />;
        } else {
          return <Block key={brick.brickId} {...brick} />
        }
      })}
      <button onClick={onCreateCodeBlockClick}>Create code block</button>
      <button onClick={onCreateTextBlockClick}>Create text block</button>
    </div>
  );
};

export const Universe: React.FC = () => {
  return (
    <RecoilRoot>
      <UniverseView />
    </RecoilRoot>
  );
};
