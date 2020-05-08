import React, { useState, useCallback, useEffect } from 'react';
import { importMdx, AsteroidNote } from '../remark/importMdx';
import { CodeBlock } from './CodeBlock';
import { MarkdownBlock } from './MarkdownBlock';
import * as UI from './ui';

export type CodeBlockStatus = 'init' | 'live' | 'outdated' | 'running' | 'fail';

export interface Providence {
  asteroidOrder: string[];
  asteroidReturn: { [id: string]: object | null };
  asteroidStatus: { [id: string]: CodeBlockStatus };
}

export const Universe: React.FC<{ code?: string }> = ({ code }) => {
  const [codeBlock, setCodeBlock] = useState([]);
  const [providence, setProvidence] = useState<Providence>({
    asteroidOrder: [],
    asteroidReturn: {},
    asteroidStatus: {},
  });

  useEffect(() => {
    const codeBlock = importMdx(code || '');
    setCodeBlock(codeBlock);
    const asteroids = codeBlock.filter(
      ({ block }) => block === 'asteroid'
    ) as AsteroidNote[];
    setProvidence({
      asteroidOrder: asteroids.map(({ id }) => id),
      asteroidReturn: {},
      asteroidStatus: asteroids.reduce((acc, { id }) => {
        return { ...acc, [id]: 'init' };
      }, {}),
    });
  }, [code]);

  useEffect(() => {
    console.log('>', providence);
    const { asteroidStatus } = providence;
    if (Object.values(asteroidStatus).some((status) => status === 'init')) {
      setTimeout(() => {
        setProvidence({
          ...providence,
          asteroidStatus: Object.entries(asteroidStatus).reduce(
            (acc, [k, v]) => {
              return { ...acc, [k]: v === 'init' ? 'running' : v };
            },
            {}
          ),
        });
      }, 1000);
    }
  }, [providence]);

  return (
    <>
      <UI.Heading>Universe</UI.Heading>
      {codeBlock.map(({ block, text, id }, i) =>
        block === 'markdown' ? (
          <MarkdownBlock key={i} note={text} />
        ) : block === 'asteroid' ? (
          <CodeBlock
            key={i}
            note={text}
            asteroidId={id}
            providence={providence}
            onProvidenceUpdate={setProvidence}
          />
        ) : (
          <pre>{text}</pre>
        )
      )}
    </>
  );
};
