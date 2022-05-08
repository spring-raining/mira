import { useCallback } from 'react';
import { supportsFileSystemAccess } from '../services/fileSystemAccessApi';
import { FileSystemService } from '../services/filesystem/fileSystem.trait';
import { WorkspaceService } from '../services/workspace/workspace.trait';
import { useServiceContext } from './useServiceContext';

export const useFileAccess = () => {
  const { register } = useServiceContext();

  const showDirectoryPicker = useCallback(async () => {
    if (!supportsFileSystemAccess) {
      return;
    }
    let rootHandler: FileSystemHandle;
    try {
      rootHandler = await window.showDirectoryPicker();
    } catch (e) {
      // Request accessing permission was aborted by user
      console.error(e);
      return;
    }
    const { getWorkspaceRepository } = await import(
      '../services/workspace/workspace.impl.standalone'
    );
    const { getFileSystemRepository } = await import(
      '../services/filesystem/fileSystem.impl.standalone'
    );
    register(
      'workspace',
      new WorkspaceService(getWorkspaceRepository({ rootHandler })),
    );
    register(
      'fileSystem',
      new FileSystemService(getFileSystemRepository({ rootHandler })),
    );
  }, [register]);

  return {
    supportsFileSystemAccess,
    showDirectoryPicker,
  };
};
