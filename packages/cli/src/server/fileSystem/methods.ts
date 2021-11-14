import * as fs from 'fs/promises';
import {
  FSFileObject,
  FSFileHandlerObject,
  FSDirectoryHandlerObject,
} from '@mirajs/cli-workspace';
import { ProjectConfig } from '../../config';
import { resolveProjectPath } from '../../file';

export const getFile = async (
  { path }: { path: string[] },
  config: ProjectConfig
): Promise<FSFileObject> => {
  return {
    buf: await fs.readFile(resolveProjectPath({ pathname: path, config })),
  };
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
  const stat = await fs.lstat(resolveProjectPath({ pathname: path, config }));
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
  const children = await fs.readdir(
    resolveProjectPath({ pathname: path, config }),
    {
      withFileTypes: true,
    }
  );
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

export const writeFile = async (
  {
    path,
    data,
  }: {
    path: string[];
    data: Uint8Array | string;
  },
  config: ProjectConfig
) => {
  await fs.writeFile(resolveProjectPath({ pathname: path, config }), data);
};
