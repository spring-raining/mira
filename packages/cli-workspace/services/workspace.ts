import { injectable } from 'tsyringe';
import 'reflect-metadata';
import { MiraMdxFileItem } from '../types/workspace';

export const workspaceServiceToken = 'WorkspaceService';

export interface WorkspaceRepository {
  getMiraFiles(): Promise<MiraMdxFileItem<number>[]>;
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
