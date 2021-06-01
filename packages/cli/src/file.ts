import { promises as fs } from 'fs';
import path from 'path';
import { MiraMdxFileItem, FileStat } from '@mirajs/cli-workspace';
import picomatch from 'picomatch';
import { ProjectConfig } from './config';
import { MIDDLEWARE_PATH_PREFIX } from './constants';

export const readProjectFileObject = async ({
  pathname,
  config,
}: {
  pathname: string;
  config: ProjectConfig;
}): Promise<MiraMdxFileItem<number> | FileStat<number>> => {
  const { workspace, mdx } = config.mira;
  const relPath = path.relative(workspace, pathname);
  const absPath = path.resolve(workspace, pathname);
  if (relPath.includes('..')) {
    throw new Error('Trying to access a file outside of workspace');
  }

  const { size, mtime, birthtime } = await fs.stat(absPath);
  const fileStat = {
    path: path.posix.join('/', path.posix.relative(workspace, pathname)),
    size,
    mtime: mtime.getTime(),
    birthtime: birthtime.getTime(),
  };
  if (picomatch(mdx.includes, { ignore: mdx.excludes })(relPath)) {
    const body = await fs.readFile(absPath, { encoding: 'utf-8' });
    return {
      ...fileStat,
      depsRootPath: MIDDLEWARE_PATH_PREFIX,
      supports: 'miraMdx' as const,
      body,
    };
  }
  return fileStat;
};
