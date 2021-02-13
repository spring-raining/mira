import FS from '@isomorphic-git/lightning-fs';
import { Project } from '../contexts/workspace';

export type FileSystemService = {
  listProjects(): Promise<Project[]>;
  loadProject(name: string): Promise<string>;
  saveProject(name: string, mdx: string): Promise<void>;
};

export const createFileSystemService = (name: string): FileSystemService => {
  const fs = new FS();
  fs.init(name);

  const listProjects = async (): Promise<Project[]> => {
    const ls = await fs.promises.readdir('/');
    return (
      await Promise.all(
        ls.map(async (filename) => {
          const matched = filename.match(/^([a-zA-Z0-9\-_.!~*'()%]+)\.mdx$/);
          if (!matched) {
            return;
          }
          const stats = await fs.promises.lstat(`/${filename}`);
          if (!stats.isFile()) {
            return;
          }
          return {
            name: decodeURIComponent(matched[1]),
            createdAt: stats.ctimeMs,
            modifiedAt: stats.mtimeMs,
          };
        })
      )
    ).filter((v): v is Project => !!v);
  };

  const loadProject = async (name: string): Promise<string> => {
    return await fs.promises.readFile(`/${encodeURIComponent(name)}.mdx`, {
      encoding: 'utf8',
    });
  };

  const saveProject = async (name: string, mdx: string): Promise<void> => {
    await fs.promises.writeFile(`/${encodeURIComponent(name)}.mdx`, mdx, {
      encoding: 'utf8',
    });
  };

  return {
    listProjects,
    loadProject,
    saveProject,
  };
};
