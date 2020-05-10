import { FlexProps } from '@chakra-ui/core';
import * as UI from '../ui';

export const Block: React.FC<FlexProps & { active?: boolean }> = ({
  active,
  ...other
}) => (
  <UI.Flex
    my={8}
    w="100%"
    {...other}
    bg={active ? 'gray.100' : 'gray.50'}
    boxShadow={active && 'sm'}
  />
);

export const BlockEditorPane = (props) => (
  <UI.Box w="50%" p={4} pr={0} {...props} />
);

export const BlockPreviewPane = (props) => (
  <UI.Box w="50%" bg="gray.100" px={4} {...props} />
);
