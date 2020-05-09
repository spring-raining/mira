import React, { useContext, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { UniverseContext } from '../../contexts/universe';
import { genAsteroidId } from '../../utils';
import * as UI from '../ui';

export const NewBlockButtonSet = () => {
  const {
    state: {
      bricks,
      providence: { asteroid, asteroidOrder },
    },
    dispatch,
  } = useContext(UniverseContext);

  const addCodeBrick = useCallback(() => {
    let asteroidId: string;
    do {
      asteroidId = genAsteroidId();
    } while (asteroidId in asteroid);

    const lastAsteroid = asteroid[asteroidOrder[asteroidOrder.length - 1]];
    dispatch({
      bricks: [
        ...bricks,
        {
          key: nanoid(),
          noteType: 'asteroid',
          text: '',
          id: asteroidId,
        },
      ],
      providence: {
        asteroid: {
          ...asteroid,
          [asteroidId]: {
            result: null,
            status: 'outdated',
            scope: {
              ...lastAsteroid.scope,
              ...(lastAsteroid.result || {}),
            },
          },
        },
        asteroidOrder: [...asteroidOrder, asteroidId],
      },
    });
  }, [bricks, asteroid, asteroidOrder]);
  const addMarkdownBrick = useCallback(() => {
    dispatch({
      bricks: [
        ...bricks,
        {
          key: nanoid(),
          noteType: 'markdown',
          text: '',
        },
      ],
    });
  }, [bricks]);
  return (
    <UI.Flex>
      <UI.Button mx={2} borderRadius="full" onClick={addCodeBrick}>
        <UI.Icon name="add" mr={2} />
        Code
      </UI.Button>
      <UI.Button mx={2} borderRadius="full" onClick={addMarkdownBrick}>
        <UI.Icon name="add" mr={2} />
        Note
      </UI.Button>
    </UI.Flex>
  );
};
