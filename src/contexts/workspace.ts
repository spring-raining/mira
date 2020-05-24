import { createContext } from 'react';
import FS from '@isomorphic-git/lightning-fs';

const fs = new FS();

export interface WorkspaceContextState {
  fs: typeof fs;
}

export type WorkspaceContextAction = {};

export const WorkspaceContext = createContext<{
  state: WorkspaceContextState;
  dispatch: (action: WorkspaceContextAction) => void;
}>({} as any);

export const workspaceContextInitialState: WorkspaceContextState = { fs };

export const workspaceContextReducer = (
  state: WorkspaceContextState,
  _action: WorkspaceContextAction
): WorkspaceContextState => state;
