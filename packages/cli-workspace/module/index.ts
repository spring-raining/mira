import path from 'path';
import next from 'next';
import type createServer from 'next/dist/server/next';
import { NextServer } from 'next/dist/server/next';
import { container } from 'tsyringe';
import {
  workspaceServiceToken,
  WorkspaceRepository,
  WorkspaceService,
} from '../services/workspace';

export type { WorkspaceRepository };

export default (
  { workspaceRepository }: { workspaceRepository: WorkspaceRepository },
  options: Parameters<typeof createServer>[0] = {}
): {
  app: NextServer;
} => {
  container.register(workspaceServiceToken, {
    useValue: new WorkspaceService(workspaceRepository),
  });
  return {
    app: next({
      dir: path.resolve(__dirname, '..'),
      ...options,
    }),
  };
};
