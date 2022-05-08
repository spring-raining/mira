import { deepCollectFiles } from '../fileSystemAccessApi';
import { WorkspaceRepository } from './workspace.trait';

export const defaultIgnoreDir = [
  'node_modules',
  'flow-typed',
  'coverage',
  '.git',
];

export const getWorkspaceRepository = ({
  rootHandler,
}: {
  rootHandler: FileSystemHandle;
}): WorkspaceRepository => {
  return {
    mode: 'standalone',
    workspaceDirname: rootHandler.name,
    constants: {
      base: '/',
      depsContext: '/_mira/',
      frameworkUrl: '', // TODO
    },
    getMiraFiles: async () => {
      // TODO: Respect gitignore or other user settings
      const entry = await deepCollectFiles({
        match: /\.mdx/,
        handler: rootHandler,
        ignoreDir: defaultIgnoreDir,
      });
      return await Promise.all(
        entry.map(async ([path, handler]) => {
          const file = await handler.getFile();
          return {
            path,
            size: file.size,
            mtime: file.lastModified,
            supports: 'miraMdx' as const,
            body: await file.text(),
          };
        }),
      );
    },
  };
};
