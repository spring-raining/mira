import { injectable } from 'tsyringe';
import { MiraMdxFileItem } from '../../types/workspace';

export const workspaceServiceToken = 'WorkspaceService';

export interface WorkspaceRepository {
  mode: 'devServer' | 'standalone' | 'unknown';
  workspaceDirname: string;
  constants: {
    base: string;
    depsContext: string;
    frameworkUrl: string;
    hmrUpdateEventName?: string;
    hmrPreambleImportPath?: string;
    devServerWatcherUpdateEventName?: string;
    devServerWatcherImportPath?: string;
  };
  getMiraFiles(): Promise<MiraMdxFileItem<number>[]>;
}

@injectable()
export class WorkspaceService {
  constructor(public service: WorkspaceRepository) {}
}
