import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
  useReducer,
} from 'react';
import { nanoid } from 'nanoid';
import {
  Asteroid,
  Providence,
  UniverseContext,
  universeContextInitialState,
  universeContextReducer,
} from '../contexts/universe';
import { importMdx, AsteroidNote } from '../remark/importMdx';
import { NewBlockButtonSet } from './Universe/NewBlockButtonSet';
import { CodeBlock } from './CodeBlock';
import { MarkdownBlock } from './MarkdownBlock';
import * as UI from './ui';

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

interface UniverseProps {
  mdx?: string;
}

const UniverseView: React.FC<UniverseProps> = ({ mdx }) => {
  const {
    state: { bricks, providence },
    dispatch,
  } = useContext(UniverseContext);

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
      dispatch({
        providence: arbitrate(event),
      });

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
    const codeBlock = importMdx(mdx || '');
    const asteroids = codeBlock.filter(
      ({ noteType }) => noteType === 'asteroid'
    ) as AsteroidNote[];
    const providence: Providence = {
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
    };
    dispatch({
      bricks: codeBlock.map((block) => ({ ...block, key: nanoid() })),
      providence,
    });
  }, [mdx]);

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
      dispatch({
        providence: {
          ...providence,
          asteroid: {
            ...asteroid,
            [asteroidOrder[initIdx]]: {
              ...runner,
              status: 'running',
            },
          },
        },
      });
    }
  }, [providence]);

  return (
    <>
      <UI.Heading>Universe</UI.Heading>
      {bricks.map((brick) => {
        const { noteType, text, key } = brick;
        if (noteType === 'markdown') {
          return <MarkdownBlock key={key} note={text} />;
        } else if (noteType === 'asteroid') {
          const { id } = brick as Omit<AsteroidNote, 'children'>;
          return (
            <CodeBlock
              key={key}
              note={text}
              asteroidId={id}
              onEvaluateStart={(...v) => onEvaluateStart(id, ...v)}
              onEvaluateFinish={(...v) => onEvaluateFinish(id, ...v)}
            />
          );
        } else {
          return <pre key={key}>{text}</pre>;
        }
      })}
      <UI.Flex justify="center">
        <NewBlockButtonSet />
      </UI.Flex>
    </>
  );
};

export const Universe: React.FC<UniverseProps> = (props) => {
  const [state, dispatch] = useReducer(
    universeContextReducer,
    universeContextInitialState
  );
  return (
    <UniverseContext.Provider value={{ state, dispatch }}>
      <UniverseView {...props} />
    </UniverseContext.Provider>
  );
};
