import { MiraMdxFileItem } from './../../types/workspace';
import { WorkspaceRepository } from './workspace.trait';

export const getWorkspaceRepository = ({
  initialMiraFiles,
  workspaceDirname,
  constants,
}: {
  initialMiraFiles: MiraMdxFileItem<number>[];
  workspaceDirname: string;
  constants: WorkspaceRepository['constants'];
}): WorkspaceRepository => {
  const miraFiles = [...initialMiraFiles];
  return {
    mode: 'devServer',
    workspaceDirname,
    constants,
    getMiraFiles: async () => miraFiles,
  };
};
