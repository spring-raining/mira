import { useMemo } from 'react';
import { useConfig } from '../state/config';
import { KeyActions, KeyMap } from '../types';
import { useHistory } from './useHistory';

export const defaultKeyMap: KeyMap = {
  UNDO: 'command+z',
  REDO: 'command+shift+z',
};

export const useKeyEvent = () => {
  const config = useConfig();
  const { undo, redo } = useHistory();

  const keyMap = useMemo(
    (): KeyMap => ({
      ...defaultKeyMap,
      ...config.keyMap,
    }),
    [config],
  );

  const keyEventHandlers: {
    [k in KeyActions]: (keyEvent?: KeyboardEvent) => void;
  } = {
    UNDO: undo,
    REDO: redo,
  };

  return { keyMap, keyEventHandlers };
};
