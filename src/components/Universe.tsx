import React, { useState, useEffect, useMemo } from 'react';

import { importMdx, AsteroidNote } from '../remark/importMdx';
import { CodeBlock } from './CodeBlock';
import { MarkdownBlock } from './MarkdownBlock';
import * as UI from './ui';

export type CodeBlockStatus = 'init' | 'live' | 'outdated' | 'running';

export interface Asteroid {
  result: object | null;
  status: CodeBlockStatus;
  scope: object;
}

export interface Providence {
  asteroid: { [id: string]: Asteroid };
  asteroidOrder: string[];
}

export const Universe: React.FC<{ code?: string }> = ({ code }) => {
  const [codeBlock, setCodeBlock] = useState([]);
  const [providence, setProvidence] = useState<Providence>({
    asteroid: {},
    asteroidOrder: [],
  });

  useEffect(() => {
    const codeBlock = importMdx(code || '');
    setCodeBlock(codeBlock);
    const asteroids = codeBlock.filter(
      ({ block }) => block === 'asteroid'
    ) as AsteroidNote[];
    setProvidence({
      asteroid: asteroids.reduce<{ [id: string]: Asteroid }>((acc, { id }) => {
        return {
          ...acc,
          [id]: {
            result: null,
            status: 'init',
            scope: {},
          },
        };
      }, {}),
      asteroidOrder: asteroids.map(({ id }) => id),
    });
  }, [code]);

  useEffect(() => {
    const { asteroidOrder, asteroid } = providence;
    const initIdx = asteroidOrder.findIndex(
      (id) => asteroid[id]?.status === 'init'
    );
    const runningIdx = asteroidOrder.findIndex(
      (id) => asteroid[id]?.status === 'running'
    );
    if (initIdx >= 0 && (initIdx < runningIdx || runningIdx < 0)) {
      const runner = asteroid[asteroidOrder[initIdx]];
      setProvidence({
        ...providence,
        asteroid: {
          ...asteroid,
          [asteroidOrder[initIdx]]: {
            ...runner,
            status: 'running',
          },
        },
      });
    }
  }, [providence]);

  const onEvaluateStart = useMemo(() => {
    return (asteroidId: string, runId: string) => {
      const { asteroidOrder } = providence;
      let nextAsteroid: Providence['asteroid'] = {
        ...providence.asteroid,
        [asteroidId]: {
          ...providence.asteroid[asteroidId],
          status: 'running',
        },
      };
      const evaluatedIdx = asteroidOrder.findIndex((id) => id === asteroidId);
      if (evaluatedIdx >= 0) {
        nextAsteroid = asteroidOrder
          .slice(evaluatedIdx + 1)
          .reduce((acc, id) => {
            const asteroid = nextAsteroid[id];
            if (!asteroid || asteroid.status === 'init') {
              return acc;
            } else {
              return { ...acc, [id]: { ...asteroid, status: 'outdated' } };
            }
          }, nextAsteroid);
      }
      setProvidence({
        ...providence,
        asteroid: nextAsteroid,
      });
    };
  }, [providence]);

  const onEvaluateFinish = useMemo(() => {
    return (asteroidId: string, runId: string, ret?: object | null) => {
      let nextAsteroid: Providence['asteroid'] = {
        ...providence.asteroid,
        [asteroidId]: {
          ...providence.asteroid[asteroidId],
          status: 'live',
          result: ret || null,
        },
      };
      const evaluatedIdx = providence.asteroidOrder.findIndex(
        (id) => id === asteroidId
      );
      if (evaluatedIdx >= 0) {
        let aboveScope = providence.asteroidOrder
          .slice(0, evaluatedIdx + 1)
          .reduce((acc, id) => {
            return {
              ...acc,
              ...(nextAsteroid[id]?.result || {}),
            };
          }, {});
        providence.asteroidOrder.slice(evaluatedIdx + 1).reduce((acc, id) => {
          nextAsteroid = {
            ...nextAsteroid,
            [id]: {
              ...nextAsteroid[id],
              scope: { ...acc, ...(ret || {}) },
              status: nextAsteroid[id]?.status === 'init' ? 'init' : 'outdated',
            },
          };
          return {
            ...acc,
            ...(providence.asteroid[id]?.result || {}),
          };
        }, aboveScope);
      }
      setProvidence({
        ...providence,
        asteroid: nextAsteroid,
      });
    };
  }, [providence]);

  return (
    <>
      <UI.Heading>Universe</UI.Heading>
      {codeBlock.map(({ block, text, id }, i) =>
        block === 'markdown' ? (
          <MarkdownBlock key={i} note={text} />
        ) : block === 'asteroid' ? (
          <CodeBlock
            key={id}
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
