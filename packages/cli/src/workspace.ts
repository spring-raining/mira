import { promises as fs } from 'fs';
import path from 'path';
import { WorkspaceRepository } from '@asteroid-mdx/cli-workspace';
import { CliArgs } from './commands';
import { globFiles } from './util';

export const getWorkspaceRepository = ({
  rootDir,
}: Pick<CliArgs, 'rootDir'>): WorkspaceRepository => {
  return {
    getAsteroidFiles: async () => {
      const paths = await globFiles({
        patterns: '**/*.mdx',
        cwd: rootDir,
        gitignore: true,
      });
      return await Promise.all(
        paths.map(async (p) => {
          const absPath = path.resolve(rootDir, p);
          const { size, mtime, birthtime } = await fs.stat(absPath);
          const body = await fs.readFile(absPath, { encoding: 'utf-8' });
          return {
            path: path.join('/', p),
            depsRootPath: '/_asteroid',
            body,
            size,
            mtime,
            birthtime,
          };
        })
      );
    },
  };
};
