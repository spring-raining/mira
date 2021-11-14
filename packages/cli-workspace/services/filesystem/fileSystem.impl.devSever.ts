import { DevServerWatcher } from '../../types/devServer';
import { FileSystemRepository } from './fileSystem.trait';

export const getFileSystemRepository = ({
  devServerWatcherImportPath,
}: {
  devServerWatcherImportPath: string;
}): FileSystemRepository => {
  const initDevServerWatcher = import(
    /* webpackIgnore:true */ devServerWatcherImportPath
  ) as Promise<DevServerWatcher>;
  return {
    getFile: async (data) => {
      const { sendMessageWaitForResponse } = await initDevServerWatcher;
      return await sendMessageWaitForResponse<
        ReturnType<FileSystemRepository['getFile']>
      >({
        type: 'mira:fs:getFile',
        data,
      });
    },
    getFileHandle: async (data) => {
      const { sendMessageWaitForResponse } = await initDevServerWatcher;
      return await sendMessageWaitForResponse<
        ReturnType<FileSystemRepository['getFileHandle']>
      >({
        type: 'mira:fs:getFileHandle',
        data,
      });
    },
    getDirectoryHandle: async (data) => {
      const { sendMessageWaitForResponse } = await initDevServerWatcher;
      return await sendMessageWaitForResponse<
        ReturnType<FileSystemRepository['getDirectoryHandle']>
      >({
        type: 'mira:fs:getDirectoryHandle',
        data,
      });
    },
    writeFile: async (data) => {
      const { sendMessage } = await initDevServerWatcher;
      await sendMessage({
        type: 'mira:fs:writeFile',
        data,
      });
    },
  };
};
