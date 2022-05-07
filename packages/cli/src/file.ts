import { promises as fs } from 'fs';
import path from 'path';
import { MiraMdxFileItem, FileStat } from '@mirajs/workspace';
import picomatch from 'picomatch';
import { ProjectConfig } from './config';

export const resolveProjectPath = ({
  pathname,
  config,
}: {
  pathname: string | string[];
  config: ProjectConfig;
}): string => {
  const jointPath = Array.isArray(pathname) ? path.join(...pathname) : pathname;
  const { workspace } = config.mira;
  const relPath = path.relative(workspace, jointPath);
  if (relPath.includes('..')) {
    throw new Error('Trying to access a file outside of workspace');
  }
  return path.resolve(workspace, jointPath);
};

export const readProjectFileObject = async ({
  pathname,
  config,
}: {
  pathname: string;
  config: ProjectConfig;
}): Promise<MiraMdxFileItem<number> | FileStat<number>> => {
  const { workspace, mdx } = config.mira;
  const relPath = path.relative(workspace, pathname);
  const absPath = resolveProjectPath({ pathname, config });

  const { size, mtime } = await fs.stat(absPath);
  const fileStat = {
    path: path.posix.relative(workspace, pathname),
    size,
    mtime: mtime.getTime(),
  };
  if (picomatch(mdx.includes, { ignore: mdx.excludes })(relPath)) {
    const body = await fs.readFile(absPath, { encoding: 'utf-8' });
    return {
      ...fileStat,
      supports: 'miraMdx' as const,
      body,
    };
  }
  return fileStat;
};
