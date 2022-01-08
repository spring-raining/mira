import { GetServerSidePropsContext } from 'next';
import { injectable } from 'tsyringe';
import { MiraMdxFileItem } from '../../types/workspace';

export const workspaceServiceToken = 'WorkspaceService';

export interface WorkspaceRepository {
  mode: 'devServer' | 'standalone' | 'unknown';
  getMiraFiles(
    ctx: GetServerSidePropsContext,
  ): Promise<MiraMdxFileItem<number>[]>;
  constants: {
    hmrUpdateEventName?: string;
    hmrPreambleImportPath?: string;
    devServerWatcherUpdateEventName?: string;
    devServerWatcherImportPath?: string;
  };
}

@injectable()
export class WorkspaceService {
  constructor(public service: WorkspaceRepository) {}
}
