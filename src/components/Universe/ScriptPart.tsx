import React, { useState, useCallback, useContext } from 'react';
import Linkify from 'react-linkify';
import { UniverseContext, ScriptBrick } from '../../contexts/universe';
import * as UI from '../ui';
import { useRuler } from './useRuler';

const Link = (href, text, key) => (
  <UI.Link href={href} key={key} isExternal>
    {text}
  </UI.Link>
);

const ScriptToolButtonSet: React.FC<{ id: string }> = ({ id }) => {
  const { state, dispatch } = useContext(UniverseContext);
  const { resetAsteroidResult } = useRuler(state);

  const onDeleteButtonClick = useCallback(() => {
    const { imports } = state.providence;
    const bricks = state.bricks
      .map((brick) =>
        brick.children.some((c) => c.id === id)
          ? {
              ...brick,
              children: brick.children.filter((c) => c.id !== id),
            }
          : brick
      )
      .filter(({ children }) => children.length > 0);
    dispatch({
      bricks,
      providence: {
        ...resetAsteroidResult(),
        imports: imports.filter((def) => def.id !== id),
      },
    });
  }, [resetAsteroidResult, state, dispatch, id]);

  return (
    <UI.IconButton
      aria-label="Delete"
      rounded="full"
      variant="ghost"
      variantColor="red"
      icon="close"
      onClick={onDeleteButtonClick}
    />
  );
};

export const ScriptPart: React.FC<{ note: ScriptBrick }> = ({ note }) => {
  const [hover, setHover] = useState(false);
  const blockCallbacks = {
    onMouseOver: useCallback(() => setHover(true), []),
    onMouseOut: useCallback(() => setHover(false), []),
  };
  return (
    <UI.Box {...blockCallbacks} my="-1rem" px={4} py={4} w="100%" fontSize="sm">
      {note.children.map((ast, index) => {
        if (ast.type === 'import') {
          return (
            <UI.Flex key={index} align="center">
              <UI.Box flexBasis="6rem">
                <UI.Tag
                  size="sm"
                  variant="outline"
                  variantColor="purple"
                  rounded="full"
                >
                  Module
                </UI.Tag>
              </UI.Box>
              <UI.Box flex={1} overflowX="auto">
                <pre>
                  <Linkify componentDecorator={Link}>{ast.value}</Linkify>
                </pre>
              </UI.Box>
              <UI.Box
                flex={0}
                opacity={hover ? 1 : 0}
                pointerEvents={hover ? 'auto' : 'none'}
                transition="all ease-out 80ms"
              >
                <ScriptToolButtonSet id={ast.id} />
              </UI.Box>
            </UI.Flex>
          );
        }
        return (
          <UI.Box key={index} pl="6rem">
            <pre>{ast.value}</pre>
          </UI.Box>
        );
      })}
    </UI.Box>
  );
};
