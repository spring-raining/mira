import { Flex, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import { useMiraFiles } from '../state/workspace';

export const FileTreeView: React.VFC = () => {
  const { miraFiles, activeFilePath, setActiveFilePath } = useMiraFiles();

  return (
    <Stack direction="column" py={2} spacing={0}>
      {miraFiles.map(({ path }) => (
        <Flex
          key={path}
          cursor="pointer"
          onClick={() => setActiveFilePath(path)}
          px={2}
          py={1}
          backgroundColor={path === activeFilePath ? 'gray.100' : 'transparent'}
          _hover={{
            backgroundColor: 'gray.100',
          }}
        >
          <Text fontSize="sm" isTruncated>
            {path}
          </Text>
        </Flex>
      ))}
    </Stack>
  );
};
