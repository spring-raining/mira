export const supportsFileSystemAccess = 'showDirectoryPicker' in globalThis;

export type FileEntry = [string, FileSystemFileHandle];

export async function deepCollectFiles({
  match,
  handler,
  ignoreDir = [],
  path = '',
  foundFiles = [],
}: {
  match: string | RegExp;
  handler: FileSystemHandle;
  ignoreDir?: string[];
  path?: string;
  foundFiles?: FileEntry[];
}): Promise<FileEntry[]> {
  if (handler.kind === 'directory') {
    for await (const [name, h] of handler as FileSystemDirectoryHandle) {
      if (ignoreDir.includes(name)) {
        continue;
      }
      await deepCollectFiles({
        match,
        handler: h,
        path: [path, name].join('/'),
        foundFiles,
      });
    }
  } else if (handler.kind === 'file') {
    if (handler.name.match(match)) {
      foundFiles.push([path, handler as FileSystemFileHandle]);
    }
  }
  return foundFiles;
}

export async function resolveFileHandler({
  descendant,
  handler,
}: {
  descendant: string[];
  handler: FileSystemHandle;
}): Promise<FileSystemHandle> {
  if (descendant.length === 0) {
    return handler;
  }
  for await (const [name, h] of handler as FileSystemDirectoryHandle) {
    if (descendant[0] === name) {
      return resolveFileHandler({
        descendant: descendant.slice(1),
        handler: h,
      });
    }
  }
  throw new Error(`File not found: /${descendant.join('/')}`);
}
