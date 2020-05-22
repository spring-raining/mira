import React, { useContext, useCallback } from 'react';
import { FlexProps } from '@chakra-ui/core';
import { UniverseContext } from '../../contexts/universe';
import * as UI from '../ui';
import { useRuler } from './useRuler';

export const ToolbarContainer: React.FC<
  FlexProps & { side: 'top' | 'bottom'; show?: boolean }
> = ({ side, show = true, ...other }) => (
  <UI.Flex
    position="absolute"
    zIndex={1}
    px={6}
    py={2}
    top={side === 'top' && 0}
    bottom={side === 'bottom' && 0}
    transform={`translateY(${(side === 'top' ? -1 : 1) * (show ? 50 : 40)}%)`}
    opacity={show ? 1 : 0}
    pointerEvents={show ? 'auto' : 'none'}
    transition="all ease-out 80ms"
    {...other}
  />
);

export const InsertBlockToolbar: React.FC<{ index: number }> = ({ index }) => {
  const { state, dispatch } = useContext(UniverseContext);
  const ruler = useRuler(state);

  const insertCodeBlock = useCallback(() => {
    dispatch(ruler.insertCodeBlock(index));
  }, [dispatch, ruler.insertCodeBlock, index]);

  const insertMarkdownBlock = useCallback(() => {
    dispatch(ruler.insertMarkdownBlock(index));
  }, [dispatch, ruler.insertMarkdownBlock, index]);

  return (
    <>
      <UI.Button
        mx={2}
        rounded="full"
        variant="outline"
        variantColor="purple"
        bg="white"
        size="sm"
        onClick={insertCodeBlock}
      >
        <UI.Icon name="add" mr={1} />
        Code
      </UI.Button>
      <UI.Button
        mx={2}
        rounded="full"
        variant="outline"
        variantColor="purple"
        bg="white"
        size="sm"
        onClick={insertMarkdownBlock}
      >
        <UI.Icon name="add" mr={1} />
        Note
      </UI.Button>
    </>
  );
};

export const ManipulateBlockToolbar: React.FC<{ index: number }> = ({
  index,
}) => {
  const { state, dispatch } = useContext(UniverseContext);
  const ruler = useRuler(state);

  const moveBlockToBackward = useCallback(() => {
    dispatch(ruler.moveBlock(index, -1));
  }, [dispatch, ruler.moveBlock, index]);

  const moveBlockToForward = useCallback(() => {
    dispatch(ruler.moveBlock(index, 1));
  }, [dispatch, ruler.moveBlock, index]);

  const deleteBlock = useCallback(() => {
    dispatch(ruler.deleteBlock(index));
  }, [dispatch, ruler.deleteBlock, index]);

  return (
    <>
      <UI.IconButton
        aria-label="Move to backward"
        mx={2}
        rounded="full"
        variant="outline"
        variantColor="purple"
        bg="white"
        icon="arrow-up"
        fontSize="1.5rem"
        onClick={moveBlockToBackward}
      />
      <UI.IconButton
        aria-label="Move to forward"
        mx={2}
        rounded="full"
        variant="outline"
        variantColor="purple"
        bg="white"
        icon="arrow-down"
        fontSize="1.5rem"
        onClick={moveBlockToForward}
      />
      <UI.IconButton
        aria-label="Delete"
        mx={2}
        rounded="full"
        variant="outline"
        variantColor="red"
        bg="white"
        icon="close"
        onClick={deleteBlock}
      />
    </>
  );
};
