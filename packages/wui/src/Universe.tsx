import { css } from 'lightwindcss';
import React from 'react';
import { RecoilRoot } from 'recoil';
import { CodeBlock } from './Universe/CodeBlock';

const UniverseView: React.FC = () => {
  return (
    <div
      className={css`
        width: 100%;
        background-color: beige;
      `}
    >
      <CodeBlock />
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
