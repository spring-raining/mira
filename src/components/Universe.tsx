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
  asteroidScope: { [id: string]: object };
}

export const Universe: React.FC<{ code?: string }> = ({ code }) => {
  const [codeBlock, setCodeBlock] = useState([]);
  const [providence, setProvidence] = useState<Providence>({
    asteroidOrder: [],
    asteroidReturn: {},
    asteroidStatus: {},
    asteroidScope: {},
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
      asteroidScope: {},
    });
  }, [code]);

  useEffect(() => {
    const { asteroidOrder, asteroidStatus } = providence;
    const initIdx = asteroidOrder.findIndex(
      (id) => id in asteroidStatus && asteroidStatus[id] === 'init'
    );
    const runningIdx = asteroidOrder.findIndex(
      (id) => id in asteroidStatus && asteroidStatus[id] === 'running'
    );
    if (initIdx >= 0 && (initIdx < runningIdx || runningIdx < 0)) {
      setProvidence({
        ...providence,
        asteroidStatus: {
          ...asteroidStatus,
          [asteroidOrder[initIdx]]: 'running',
        },
      });
    }
  }, [providence]);

  const onEvaluateStart = useCallback(
    (asteroidId: string, runId: string) => {},
    [providence]
  );

  const onEvaluateFinish = useCallback(
    (asteroidId: string, runId: string, ret?: object | null) => {
      const nextAsteroidReturn = { ...providence.asteroidReturn };
      if (ret !== undefined) {
        nextAsteroidReturn[asteroidId] = ret;
      } else {
        delete nextAsteroidReturn[asteroidId];
      }
      const evaluatedIdx = providence.asteroidOrder.findIndex(
        (id) => id === asteroidId
      );
      let nextAsteroidScope = providence.asteroidScope;
      if (evaluatedIdx >= 0) {
        let aboveScope = providence.asteroidOrder
          .slice(0, evaluatedIdx + 1)
          .reduce((acc, id) => {
            return {
              ...acc,
              ...(nextAsteroidReturn[id] || {}),
            };
          }, {});
        providence.asteroidOrder.slice(evaluatedIdx + 1).reduce((acc, id) => {
          nextAsteroidScope = {
            ...nextAsteroidScope,
            [id]: { ...acc, ...(ret || {}) },
          };
          return {
            ...acc,
            ...(providence.asteroidReturn[id] || {}),
          };
        }, aboveScope);
      }
      setProvidence({
        ...providence,
        asteroidReturn: nextAsteroidReturn,
        asteroidStatus: {
          ...providence.asteroidStatus,
          [asteroidId]: 'live',
        },
        asteroidScope: nextAsteroidScope,
      });
    },
    [providence]
  );

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
            // onProvidenceUpdate={setProvidence}
            onEvaluateStart={(...v) => onEvaluateStart(id, ...v)}
            onEvaluateFinish={(...v) => onEvaluateFinish(id, ...v)}
          />
        ) : (
          <pre>{text}</pre>
        )
      )}
    </>
  );
};
