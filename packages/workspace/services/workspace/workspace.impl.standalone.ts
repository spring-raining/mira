import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import globby from 'globby';
import { WorkspaceRepository } from './workspace.trait';

export const examplePath = path.resolve(
  fileURLToPath(import.meta.url),
  '../../../../../examples',
);

export const getWorkspaceRepository =
  async (): Promise<WorkspaceRepository> => {
    const exampleFilePaths = await globby(
      path.resolve(examplePath, '**/*.mdx'),
    );
    const exampleFiles = await Promise.all(
      exampleFilePaths.map(async (absPath) => {
        const { size, mtime, birthtime } = await fs.stat(absPath);
        const body = await fs.readFile(absPath, { encoding: 'utf-8' });
        return {
          path: path.relative(examplePath, absPath),
          size,
          mtime: mtime.getTime(),
          birthtime: birthtime.getTime(),
          supports: 'miraMdx' as const,
          body,
          depsRootPath: '/_mira', //TODO
        };
      }),
    );

    return {
      getMiraFiles: async () => exampleFiles,
      mode: 'standalone',
      constants: {},
    };
  };
