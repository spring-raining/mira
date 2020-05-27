import { createContext } from 'react';
import { WorkspaceContextAction } from '../actions/workspace';
import { FileSystemService } from '../services/fs';

export interface Project {
  name: string;
  mdx?: string;
  createdAt: number;
  modifiedAt: number;
}

export interface WorkspaceContextState {
  fs?: FileSystemService;
  project: { [name: string]: Project };
}
export const WorkspaceContext = createContext<{
  state: WorkspaceContextState;
  dispatch: (action: WorkspaceContextAction) => void;
}>({} as any);

export const workspaceContextInitialState: WorkspaceContextState = {
  project: {},
};

export const workspaceContextReducer = (
  state: WorkspaceContextState,
  action: WorkspaceContextAction
): WorkspaceContextState => {
  switch (action.type) {
    case 'WORKSPACE.UPDATE_PROJECT':
      const { name, mdx } = action.payload;
      state.fs?.saveProject(name, mdx);
      return {
        ...state,
        project: {
          ...state.project,
          [name]: {
            ...(state.project[name] || {
              name,
              createdAt: Date.now(),
            }),
            mdx,
            modifiedAt: Date.now(),
          },
        },
      };
    case 'WORKSPACE.SET_FILE_SYSTEM':
      return { ...state, fs: action.payload };
    case 'WORKSPACE.SET_PROJECTS':
      return {
        ...state,
        project: action.payload.reduce(
          (acc, project) => ({ ...acc, [project.name]: project }),
          {} as { [name: string]: Project }
        ),
      };
    default:
      return state;
  }
};
