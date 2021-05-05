import { Flex, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import { useAsteroidFiles } from '../hooks/workspace';

export const FileTreeView: React.VFC = () => {
  const { asteroidFiles, setActiveFilePath } = useAsteroidFiles();

  return (
    <Stack direction="column" py={2}>
      {asteroidFiles.map(({ path }) => (
        <Flex
          key={path}
          cursor="pointer"
          onClick={() => setActiveFilePath(path)}
          px={2}
          py={1}
          _hover={{
            backgroundColor: 'gray.100',
          }}
        >
          <Text fontSize="sm">{path}</Text>
        </Flex>
      ))}
    </Stack>
  );
};
