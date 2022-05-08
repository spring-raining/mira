import {
  Flex,
  Heading,
  Button,
  Text,
  Divider,
  Code,
  SimpleGrid,
} from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { useFileAccess } from '../hooks/useFileAccess';
import { useServiceContext } from '../hooks/useServiceContext';

export const StartupView: React.VFC = () => {
  const { workspace } = useServiceContext();
  const serveUrl = useMemo(() => {
    if (!workspace) {
      return;
    }
    return new URL(workspace.service.constants.base, location.origin);
  }, [workspace]);
  const fileAccess = useFileAccess();
  return (
    <Flex
      h="full"
      w="full"
      maxW="lg"
      mx="auto"
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <Heading as="h1" size="lg" color="gray.600">
        💫 Mira
      </Heading>
      <Divider my={4} w="full" borderColor="gray.100" />
      <Flex
        direction="column"
        gap={4}
        h={24}
        justifyContent="center"
        alignItems="start"
      >
        {workspace ? (
          <div>
            {workspace.service.mode === 'devServer' && (
              <Text fontSize="sm" mb={3} color="gray.800">
                Running on
                <Text display="inline" fontWeight="bold" ml={2}>
                  Local edit mode
                </Text>
              </Text>
            )}
            {workspace.service.mode === 'standalone' && (
              <Text fontSize="sm" mb={3} color="gray.800">
                Running on
                <Text display="inline" fontWeight="bold" ml={2}>
                  Read-only mode
                </Text>
              </Text>
            )}
            <SimpleGrid columns={2} spacing={2}>
              <Text fontSize="sm" color="gray.800">
                Project directory
              </Text>
              <div>
                <Code fontSize="sm">{workspace.service.workspaceDirname}</Code>
              </div>
              <Text fontSize="sm" color="gray.800">
                Serving URL
              </Text>
              <div>
                <Code fontSize="sm">{serveUrl?.toString()}</Code>
              </div>
            </SimpleGrid>
          </div>
        ) : (
          <Flex direction="column" alignItems="center" gap={4}>
            <Text fontSize="sm" color="gray.400">
              Local project directory is not selected
            </Text>
            {fileAccess.supportsFileSystemAccess ? (
              <Button
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={fileAccess.showDirectoryPicker}
              >
                Open local directory and start editing
              </Button>
            ) : (
              <Text fontSize="sm" color="gray.400">
                File System Access API is not enabled on this browser.
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};
export default StartupView;
