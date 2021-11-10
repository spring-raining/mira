import * as fs from 'fs/promises';
import { join } from 'path';
import {
  FSFileObject,
  FSFileHandlerObject,
  FSDirectoryHandlerObject,
} from '@mirajs/cli-workspace';
import { ProjectConfig } from '../../config';

export const getFile = async (
  { path }: { path: string[] },
  config: ProjectConfig
): Promise<FSFileObject> => {
  return await fs.readFile(join(config.mira.workspace, ...path));
};

export const getFileHandle = async (
  {
    path,
    options,
  }: {
    path: string[];
    options?: { create?: boolean };
  },
  config: ProjectConfig
): Promise<FSFileHandlerObject> => {
  const stat = await fs.lstat(join(config.mira.workspace, ...path));
  if (!stat.isFile()) {
    throw new Error(`file ${path.join('/')} does not exist`);
  }
  return {
    kind: 'file',
    name: path[path.length - 1] ?? '.',
  };
};

export const getDirectoryHandle = async (
  {
    path,
    options,
  }: {
    path: string[];
    options?: { create?: boolean };
  },
  config: ProjectConfig
): Promise<FSDirectoryHandlerObject> => {
  const children = await fs.readdir(join(config.mira.workspace, ...path), {
    withFileTypes: true,
  });
  return {
    kind: 'directory',
    name: path[path.length - 1] ?? '.',
    ls: children.flatMap((d): (
      | FSFileHandlerObject
      | FSDirectoryHandlerObject
    )[] => {
      if (d.isFile()) {
        return [{ kind: 'file', name: d.name }];
      } else if (d.isDirectory()) {
        return [{ kind: 'directory', name: d.name }];
      } else {
        return [];
      }
    }),
  };
};
