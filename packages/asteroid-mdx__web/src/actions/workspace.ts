import { Project } from '../contexts/workspace';
import { FileSystemService } from '../services/fs';

export const UPDATE_PROJECT = 'WORKSPACE.UPDATE_PROJECT';
export interface UpdateProjectAction {
  type: typeof UPDATE_PROJECT;
  payload: { name: string; mdx: string };
}
export function updateProject(payload: {
  name: string;
  mdx: string;
}): UpdateProjectAction {
  return {
    type: UPDATE_PROJECT,
    payload,
  };
}

export const SET_FILE_SYSTEM = 'WORKSPACE.SET_FILE_SYSTEM';
export interface SetFileSystemAction {
  type: typeof SET_FILE_SYSTEM;
  payload: FileSystemService;
}
export function setFileSystem(payload: FileSystemService): SetFileSystemAction {
  return {
    type: SET_FILE_SYSTEM,
    payload,
  };
}

export const SET_PROJECTS = 'WORKSPACE.SET_PROJECTS';
export interface SetProjectsAction {
  type: typeof SET_PROJECTS;
  payload: Project[];
}
export function setProjects(payload: Project[]): SetProjectsAction {
  return {
    type: SET_PROJECTS,
    payload,
  };
}

export type WorkspaceContextAction =
  | UpdateProjectAction
  | SetFileSystemAction
  | SetProjectsAction;
