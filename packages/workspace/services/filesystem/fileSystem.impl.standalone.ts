import { resolveFileHandler } from '../fileSystemAccessApi';
import { FileSystemRepository } from './fileSystem.trait';

const parentPathRe = /^\.+$/g;

export const getFileSystemRepository = ({
  rootHandler,
}: {
  rootHandler: FileSystemHandle;
}): FileSystemRepository => {
  const parsePathHierarchy = (path: string) => {
    const resolved = path.replace(/^\//, '').split('/');
    if (resolved.some((n) => !n || parentPathRe.test(n))) {
      throw new Error(`Invalid file path: /${path}`);
    }
    return resolved;
  };

  return {
    getFile: async ({ path }) => {
      const descendant = path.flatMap(parsePathHierarchy);
      const handler = await resolveFileHandler({
        descendant,
        handler: rootHandler,
      });
      if (handler.kind === 'directory') {
        throw new Error(`/${descendant.join('/')} is directory`);
      }
      const f = await (handler as FileSystemFileHandle).getFile();
      return { buf: new Uint8Array(await f.arrayBuffer()) };
    },

    getFileHandle: async ({ path }) => {
      const descendant = path.flatMap(parsePathHierarchy);
      const handler = await resolveFileHandler({
        descendant,
        handler: rootHandler,
      });
      if (handler.kind === 'directory') {
        throw new Error(`/${descendant.join('/')} is directory`);
      }
      return { ...(handler as FileSystemFileHandle) };
    },

    getDirectoryHandle: async ({ path }) => {
      const descendant = path.flatMap(parsePathHierarchy);
      const handler = await resolveFileHandler({
        descendant,
        handler: rootHandler,
      });
      if (handler.kind === 'file') {
        throw new Error(`/${descendant.join('/')} is file`);
      }
      const ls: { kind: 'file' | 'directory'; name: string }[] = [];
      for await (const h of (handler as FileSystemDirectoryHandle).values()) {
        ls.push(h);
      }
      return { ...(handler as FileSystemDirectoryHandle), ls };
    },

    writeFile: async () => {
      // stub
    },
  };
};
