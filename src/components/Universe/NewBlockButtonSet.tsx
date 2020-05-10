import React, { useContext, useCallback } from 'react';
import { UniverseContext } from '../../contexts/universe';
import * as UI from '../ui';
import { useRuler } from './useRuler';

export const NewBlockButtonSet = () => {
  const { state, dispatch } = useContext(UniverseContext);
  const { bricks } = state;
  const { insertCodeBlock, insertMarkdownBlock } = useRuler(state);

  const addCodeBrick = useCallback(() => {
    dispatch(insertCodeBlock(bricks.length));
  }, [dispatch, insertCodeBlock, bricks]);

  const addMarkdownBrick = useCallback(() => {
    dispatch(insertMarkdownBlock(bricks.length));
  }, [dispatch, insertMarkdownBlock, bricks]);

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
