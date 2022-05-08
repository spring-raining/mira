import { Flex } from '@chakra-ui/react';
import { UniverseProvider } from '@mirajs/mira-editor-ui';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useServiceContext } from '../hooks/useServiceContext';
import { MiraMdxFileItem } from '../module';
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
  file: MiraMdxFileItem;
}> = ({ file }) => {
  const { fileSystem, workspace } = useServiceContext();
  const [mdx, setMdx] = useState<string>();
  if (!fileSystem || !workspace) {
    throw Promise.resolve();
  }

  const writeFile = useCallback(
    (updated: string) => {
      if (!file || updated === mdx) {
        return;
      }
      fileSystem.service.writeFile({
        path: [file.path],
        data: updated,
      });
    },
    [file, mdx, fileSystem],
  );
  const onUpdate = useDebouncedCallback(writeFile, 3000);

  useEffect(() => {
    if (!file) {
      return;
    }
    (async () => {
      const { buf } = await fileSystem.service.getFile({ path: [file.path] });
      const decoder = new TextDecoder();
      setMdx(decoder.decode(buf));
    })();
    return () => setMdx(undefined);
  }, [file, fileSystem]);

  return (
    <Flex flex={1} position="relative">
      <UniverseProvider key={file.path}>
        {typeof mdx === 'string' && (
          <Mira
            {...{ file, mdx, constants: workspace.service.constants, onUpdate }}
          />
        )}
      </UniverseProvider>
    </Flex>
  );
};

export default UniverseView;
