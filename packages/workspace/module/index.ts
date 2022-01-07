import 'reflect-metadata';
import path from 'path';
import { fileURLToPath } from 'url';
import next from 'next';
import type createServer from 'next/dist/server/next';
import { container } from 'tsyringe';
import {
  workspaceServiceToken,
  WorkspaceRepository,
  WorkspaceService,
} from '../services/workspace/workspace.trait';
import type {
  DevServerEvent,
  DevServerMessage,
  DevServerWatcher,
} from '../types/devServer';
import type {
  FSFileObject,
  FSFileHandlerObject,
  FSDirectoryHandlerObject,
} from '../types/fileSystem';
import type { MiraMdxFileItem, FileStat } from '../types/workspace';

export type {
  WorkspaceRepository,
  MiraMdxFileItem,
  FileStat,
  DevServerEvent,
  FSFileObject,
  FSFileHandlerObject,
  FSDirectoryHandlerObject,
  DevServerMessage,
  DevServerWatcher,
};

export default (
  { workspaceRepository }: { workspaceRepository: WorkspaceRepository },
  options: Parameters<typeof createServer>[0] = {},
): {
  app: ReturnType<typeof next>;
} => {
  container.register(workspaceServiceToken, {
    useValue: new WorkspaceService(workspaceRepository),
  });
  return {
    app: next({
      dir: path.resolve(fileURLToPath(import.meta.url), '../..'),
      ...options,
    }),
  };
};
