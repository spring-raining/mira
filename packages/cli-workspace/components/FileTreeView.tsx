import { Flex, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import { useAsteroidFiles } from '../hooks/workspace';

export const FileTreeView: React.VFC = () => {
  const { asteroidFiles, activeFilePath, setActiveFilePath } = useAsteroidFiles();

  return (
    <Stack direction="column" py={2} spacing={0}>
      {asteroidFiles.map(({ path }) => (
        <Flex
          key={path}
          cursor="pointer"
          onClick={() => setActiveFilePath(path)}
          px={2}
          py={1}
          backgroundColor={path === activeFilePath ? 'gray.100': 'transparent'}
          _hover={{
            backgroundColor: 'gray.100',
          }}
        >
          <Text fontSize="sm" isTruncated>{path}</Text>
        </Flex>
      ))}
    </Stack>
  );
};
