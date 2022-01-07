import { Flex } from '@chakra-ui/react';
import { UniverseProvider } from '@mirajs/wui';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { container } from 'tsyringe';
import { useWorkspaceFile } from '../hooks/workspace';
import {
  fileSystemServiceToken,
  FileSystemService,
} from '../services/filesystem/fileSystem.trait';
import { WorkspaceRepository } from '../services/workspace/workspace.trait';
import { Mira } from './Mira';

const useDebouncedCallback = <T extends unknown[]>(
  fn: (...args: T) => void,
  ms: number,
) => {
  const timer = useRef<number>();
  useEffect(() => {
    clearTimeout(timer.current);
  }, [fn, ms]);
  return (...args: T) => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => fn(...args), ms);
  };
};

export const UniverseView: React.VFC<{
  constants: WorkspaceRepository['constants'];
}> = ({ constants }) => {
  const { activeMiraFile: file } = useWorkspaceFile();
  const [mdx, setMdx] = useState<string>();

  const writeFile = useCallback(
    (updated: string) => {
      if (!file || updated === mdx) {
        return;
      }
      const fs = container.resolve<FileSystemService>(fileSystemServiceToken);
      fs.service.writeFile({
        path: [file.path],
        data: updated,
      });
    },
    [file, mdx],
  );
  const onUpdate = useDebouncedCallback(writeFile, 3000);

  useEffect(() => {
    if (!file) {
      return;
    }
    (async () => {
      const fs = container.resolve<FileSystemService>(fileSystemServiceToken);
      const { buf } = await fs.service.getFile({ path: [file.path] });
      const decoder = new TextDecoder();
      setMdx(decoder.decode(buf));
    })();
    return () => setMdx(undefined);
  }, [file]);

  if (!file) {
    return <Flex>No file</Flex>;
  }
  return (
    <Flex flex={1} position="relative">
      <UniverseProvider key={file.path}>
        {typeof mdx === 'string' && (
          <Mira {...{ file, mdx, constants, onUpdate }} />
        )}
      </UniverseProvider>
    </Flex>
  );
};
