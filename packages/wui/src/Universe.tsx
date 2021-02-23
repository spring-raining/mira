import { css } from 'lightwindcss';
import React, { useCallback } from 'react';
import { RecoilRoot } from 'recoil';
import { useBricks, createNewBrick } from './hooks/brick';
import { CodeBlock } from './Universe/CodeBlock';

const UniverseView: React.FC = () => {
  const { bricks, pushBrick } = useBricks();
  const onClick = useCallback(() => {
    pushBrick(createNewBrick('asteroid'));
  }, [pushBrick]);

  return (
    <div
      className={css`
        width: 100%;
      `}
    >
      {bricks.map((brick) => {
        if (brick.noteType === 'asteroid') {
          return <CodeBlock key={brick.brickId} brickId={brick.brickId} />;
        }
        return null;
      })}
      <button {...{ onClick }}>Create code block</button>
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
