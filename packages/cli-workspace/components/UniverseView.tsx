import { Flex, Code } from '@chakra-ui/react';
import React from 'react';
import { useWorkspaceFile } from '../hooks/workspace';

export const UniverseView: React.VFC = () => {
  const { activeAsteroidFile: file } = useWorkspaceFile();

  if (!file) {
    return <Flex>No file</Flex>;
  }
  return (
    <Flex flex={1} position="relative">
      <iframe
        style={{ flex: 1 }}
        src="universe"
      />
    </Flex>
  );
};
