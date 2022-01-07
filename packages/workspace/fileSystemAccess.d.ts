export declare global {
  interface FilePickerOptions {
    type?: {
      description?: string;
      accept?: Record<string, string | string[]>;
    }[];
    excludeAcceptAllOption?: boolean;
  }

  interface FileSystemHandlePermissionDescriptor {
    mode?: 'read' | 'readwrite';
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(
      data:
        | BufferSource
        | Blob
        | string
        | {
            type: 'write' | 'seek' | 'truncate';
            size?: number;
            position?: number;
            data?: BufferSource | Blob | string;
          },
    ): Promise<void>;
    seek(position: number): Promise<void>;
    truncate(size: number): Promise<void>;
  }

  interface FileSystemWritableFileStreamConstructor {
    new (): FileSystemWritableFileStream;
  }

  interface FileSystemHandle {
    readonly kind: 'file' | 'directory';
    readonly name: string;
    isSameEntry(other: FileSystemHandle): Promise<boolean>;
    queryPermission(
      descriptor?: FileSystemHandlePermissionDescriptor,
    ): Promise<PermissionState>;
    requestPermission(
      descriptor?: FileSystemHandlePermissionDescriptor,
    ): Promise<PermissionState>;
  }

  interface FileSystemHandleConstructor {
    new (): FileSystemHandle;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
    createWritable(options?: {
      keepExistingData?: boolean;
    }): Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemFileHandleConstructor {
    new (): FileSystemFileHandle;
  }

  interface FileSystemDirectoryHandle
    extends FileSystemHandle,
      Iterable<FileSystemHandle> {
    getFileHandle(
      name: string,
      options?: { create?: boolean },
    ): Promise<FileSystemFileHandle>;
    getDirectoryHandle(
      name: string,
      options?: { create?: boolean },
    ): Promise<FileSystemDirectoryHandle>;
    removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
    resolve(
      possibleDescendant: FileSystemHandle,
    ): Promise<string[] | undefined>;
  }

  interface FileSystemDirectoryHandleConstructor {
    new (): FileSystemDirectoryHandle;
  }

  interface Window {
    showOpenFilePicker(
      options: FilePickerOptions & {
        multiple?: false;
      },
    ): Promise<[FileSystemFileHandle]>;
    showOpenFilePicker(
      options: FilePickerOptions & {
        multiple: true;
      },
    ): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(
      options: FilePickerOptions & {
        suggestedName?: string;
      },
    ): Promise<FileSystemFileHandle>;
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
    FileSystemHandle: FileSystemHandleConstructor;
    FileSystemFileHandle: FileSystemFileHandleConstructor;
    FileSystemDirectoryHandle: FileSystemDirectoryHandleConstructor;
    FileSystemWritableFileStream: FileSystemWritableFileStreamConstructor;
  }
}
