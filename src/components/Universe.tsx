import React, { useState, useEffect, useCallback, useRef } from 'react';

import { importMdx, AsteroidNote } from '../remark/importMdx';
import { CodeBlock } from './CodeBlock';
import { MarkdownBlock } from './MarkdownBlock';
import * as UI from './ui';

export type CodeBlockStatus = 'init' | 'live' | 'outdated' | 'running';

export interface Asteroid {
  result: object | null;
  status: CodeBlockStatus;
  scope: object;
  stepNo?: number;
}

export interface Providence {
  asteroid: { [id: string]: Asteroid };
  asteroidOrder: string[];
}

interface EvaluationEvent {
  type: 'start' | 'finish';
  asteroidId: string;
  runId: string;
  ret?: object | null;
}

const useRuler = ({ providence }: { providence: Providence }) => {
  const [stepNum, setStepNum] = useState(0);
  const [currentAsteroidId, setCurrentAsteroidId] = useState<string>();
  const [currentRunId, setCurrentRunId] = useState<string>();

  const arbitrate = useCallback(
    ({ type, asteroidId, runId, ret }: EvaluationEvent): Providence => {
      const { asteroidOrder } = providence;
      const targetAsteroid = providence.asteroid[asteroidId];

      if (type === 'start') {
        let nextAsteroid: Providence['asteroid'] = {
          ...providence.asteroid,
          [asteroidId]: {
            ...targetAsteroid,
            status: 'running',
          },
        };
        if (currentAsteroidId !== asteroidId) {
          nextAsteroid[asteroidId].stepNo = stepNum + 1;
          setStepNum(stepNum + 1);
        }
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
        setCurrentAsteroidId(asteroidId);
        setCurrentRunId(runId);
        return {
          ...providence,
          asteroid: nextAsteroid,
        };
      } else if (type === 'finish') {
        if (currentRunId !== runId) {
          return {
            ...providence,
            asteroid: {
              ...providence.asteroid,
              [asteroidId]: {
                ...targetAsteroid,
                status:
                  currentAsteroidId === asteroidId ? 'running' : 'outdated',
              },
            },
          };
        }

        let nextAsteroid: Providence['asteroid'] = {
          ...providence.asteroid,
          [asteroidId]: {
            ...targetAsteroid,
            status: 'live',
            result: ret || null,
          },
        };
        const evaluatedIdx = asteroidOrder.findIndex((id) => id === asteroidId);
        if (evaluatedIdx >= 0) {
          let aboveScope = asteroidOrder
            .slice(0, evaluatedIdx)
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
              },
            };
            return {
              ...acc,
              ...(providence.asteroid[id]?.result || {}),
            };
          }, aboveScope);
        }
        return {
          ...providence,
          asteroid: nextAsteroid,
        };
      }
    },
    [providence, stepNum, currentAsteroidId, currentRunId]
  );
  return { arbitrate };
};

export const Universe: React.FC<{ code?: string }> = ({ code }) => {
  const [codeBlock, setCodeBlock] = useState([]);
  const [providence, setProvidence] = useState<Providence>({
    asteroid: {},
    asteroidOrder: [],
  });
  const { arbitrate } = useRuler({ providence });

  const evaluationEventStack = useRef<EvaluationEvent[]>([]);
  useEffect(() => {
    let id: number;
    const tick = () => {
      if (evaluationEventStack.current.length === 0) {
        id = requestAnimationFrame(tick);
        return;
      }
      const event = evaluationEventStack.current.shift();
      setProvidence(arbitrate(event));

      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [providence]);

  const onEvaluateStart = useCallback((asteroidId: string, runId: string) => {
    evaluationEventStack.current.push({
      type: 'start',
      asteroidId,
      runId,
    });
  }, []);

  const onEvaluateFinish = useCallback(
    (asteroidId: string, runId: string, ret?: object | null) => {
      evaluationEventStack.current.push({
        type: 'finish',
        asteroidId,
        runId,
        ret,
      });
    },
    []
  );

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
