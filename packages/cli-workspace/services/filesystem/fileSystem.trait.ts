import { injectable } from 'tsyringe';
import {
  FSFileObject,
  FSFileHandlerObject,
  FSDirectoryHandlerObject,
  FSGetFileMessage,
  FSGetFileHandleMessage,
  FSGetDirectoryHandleMessage,
  FSWriteFileMessage,
} from '../../types/fileSystem';

export const fileSystemServiceToken = 'FileSystemService';

export interface FileSystemRepository {
  getFile: (data: FSGetFileMessage['data']) => Promise<FSFileObject>;
  getFileHandle: (
    data: FSGetFileHandleMessage['data'],
  ) => Promise<FSFileHandlerObject>;
  getDirectoryHandle: (
    data: FSGetDirectoryHandleMessage['data'],
  ) => Promise<FSDirectoryHandlerObject>;
  writeFile: (data: FSWriteFileMessage['data']) => Promise<void>;
}

@injectable()
export class FileSystemService {
  constructor(public service: FileSystemRepository) {}
}
