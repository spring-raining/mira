import { injectable } from 'tsyringe';
import 'reflect-metadata';
import { AsteroidFileItem } from '../types/workspace';

export const workspaceServiceToken = 'WorkspaceService';

export interface WorkspaceRepository {
  getAsteroidFiles(): Promise<AsteroidFileItem[]>;
  constants: {
    hmrUpdateEventName: string;
    hmrPreambleCode: string;
  };
}

@injectable()
export class WorkspaceService {
  constructor(public service: WorkspaceRepository) {}
}
