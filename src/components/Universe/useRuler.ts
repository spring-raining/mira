import { useState, useCallback, useContext } from 'react';
import { nanoid } from 'nanoid';
import {
  UniverseContextState,
  Providence,
  AsteroidBrick,
  Asteroid,
} from '../../contexts/universe';
import { genAsteroidId } from '../../utils';

export interface EvaluationEvent {
  type: 'start' | 'finish';
  asteroidId: string;
  runId: string;
  ret?: object | null;
}

export const useRuler = ({ bricks, providence }: UniverseContextState) => {
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

  const revalueProvidence = useCallback(
    (newBricks: UniverseContextState['bricks']): Providence => {
      const prev = bricks.filter(
        ({ noteType }) => noteType === 'asteroid'
      ) as AsteroidBrick[];
      const next = newBricks.filter(
        ({ noteType }) => noteType === 'asteroid'
      ) as AsteroidBrick[];

      const nextProvidence: Providence = {
        ...providence,
        asteroid: {},
        asteroidOrder: [],
      };
      let dirty = false;
      let lastScope: object = {};
      next.forEach((brick, i) => {
        if (brick.id !== prev[i].id) {
          dirty = true;
        }
        nextProvidence.asteroidOrder.push(brick.id);
        const asteroid: Asteroid = dirty
          ? {
              result: null,
              status: 'outdated',
              scope: { ...lastScope },
            }
          : providence.asteroid[brick.id];
        nextProvidence.asteroid[brick.id] = asteroid;
        lastScope = asteroid.scope;
      });
      return nextProvidence;
    },
    [bricks, providence]
  );

  const insertCodeBlock = useCallback(
    (index: number): Pick<UniverseContextState, 'bricks' | 'providence'> => {
      const { asteroid } = providence;
      const preAsteroidOrder = bricks
        .slice(0, index)
        .filter(({ noteType }) => noteType === 'asteroid')
        .map(({ id }: AsteroidBrick) => id);
      const postAsteroidOrder = bricks
        .slice(index)
        .filter(({ noteType }) => noteType === 'asteroid')
        .map(({ id }: AsteroidBrick) => id);
      const lastAsteroid =
        preAsteroidOrder.length > 0 &&
        asteroid[preAsteroidOrder[preAsteroidOrder.length - 1]];

      let asteroidId: string;
      do {
        asteroidId = genAsteroidId();
      } while (asteroidId in asteroid);

      return {
        bricks: [
          ...bricks.slice(0, index),
          {
            brickId: nanoid(),
            noteType: 'asteroid',
            text: '',
            id: asteroidId,
          },
          ...bricks.slice(index),
        ],
        providence: {
          ...providence,
          asteroid: {
            ...asteroid,
            [asteroidId]: {
              result: null,
              status: 'outdated',
              scope: lastAsteroid
                ? {
                    ...lastAsteroid.scope,
                    ...(lastAsteroid.result || {}),
                  }
                : {},
            },
          },
          asteroidOrder: [
            ...preAsteroidOrder,
            asteroidId,
            ...postAsteroidOrder,
          ],
        },
      };
    },
    [bricks, providence]
  );

  const insertMarkdownBlock = useCallback(
    (index: number): Partial<UniverseContextState> => ({
      bricks: [
        ...bricks.slice(0, index),
        {
          brickId: nanoid(),
          noteType: 'markdown',
          text: '',
        },
        ...bricks.slice(index),
      ],
    }),
    [bricks]
  );

  const moveBlock = useCallback(
    (index: number, offset: number): Partial<UniverseContextState> => {
      if (
        index < 0 ||
        index > bricks.length - 1 ||
        index + offset < 0 ||
        index + offset > bricks.length - 1
      ) {
        return { bricks };
      }
      const target = bricks[index];
      const picked = [...bricks.slice(0, index), ...bricks.slice(index + 1)];
      const newBricks = [
        ...picked.slice(0, index + offset),
        target,
        ...picked.slice(index + offset),
      ];
      return {
        bricks: newBricks,
        providence: revalueProvidence(newBricks),
      };
    },
    [bricks, revalueProvidence]
  );

  const deleteBlock = useCallback(
    (index: number): Partial<UniverseContextState> => {
      if (index < 0 || index > bricks.length - 1) {
        return { bricks };
      }
      const newBricks = [...bricks.slice(0, index), ...bricks.slice(index + 1)];
      return {
        bricks: newBricks,
        providence: revalueProvidence(newBricks),
      };
    },
    [bricks, revalueProvidence]
  );

  return {
    arbitrate,
    insertCodeBlock,
    insertMarkdownBlock,
    moveBlock,
    deleteBlock,
    revalueProvidence,
  };
};
