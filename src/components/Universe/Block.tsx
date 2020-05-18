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
    flexDirection={['column', 'column', 'row', 'row']}
  />
);

export const BlockEditorPane = ({ children, ...props }) => (
  <UI.Box w={['100%', '100%', '50%', '50%']} p={4} pr={0} {...props}>
    <UI.Box ml={['-40px', 0, 0, 0]}>{children}</UI.Box>
  </UI.Box>
);

export const BlockPreviewPane = (props) => (
  <UI.Box
    w={['100%', '100%', '50%', '50%']}
    bg="gray.100"
    px={4}
    py={[4, 4, 0, 0]}
    overflow="auto"
    borderLeft="0.5rem solid"
    borderColor="gray.500"
    borderLeftWidth={['0.5rem', '0.5rem', 0, 0]}
    {...props}
  />
);
