import { injectable } from 'tsyringe';
import 'reflect-metadata';
import { AsteroidMdxFileItem } from '../types/workspace';

export const workspaceServiceToken = 'WorkspaceService';

export interface WorkspaceRepository {
  getAsteroidFiles(): Promise<AsteroidMdxFileItem<number>[]>;
  constants: {
    hmrUpdateEventName: string;
    hmrPreambleImportPath: string;
    devServerWatcherUpdateEventName: string;
    devServerWatcherImportPath: string;
  };
}

@injectable()
export class WorkspaceService {
  constructor(public service: WorkspaceRepository) {}
}
