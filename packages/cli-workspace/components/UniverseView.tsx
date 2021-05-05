import { Flex, Code } from '@chakra-ui/react';
import React from 'react';
import { useWorkspaceFile } from '../hooks/workspace';

export const UniverseView: React.VFC = () => {
  const { activeAsteroidFile: file } = useWorkspaceFile();

  if (!file) {
    return <Flex>No file</Flex>;
  }
  return (
    <Flex>
      <pre>
        <Code>{file.body}</Code>
      </pre>
    </Flex>
  );
};
