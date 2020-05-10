import * as UI from '../ui';

export const Block = (props) => (
  <UI.Flex my={8} px={4} py={3} w="100%" {...props} bg="gray.100" />
);

export const BlockEditorPane = (props) => <UI.Box w="50%" mx={2} {...props} />;

export const BlockPreviewPane = ({ children, ...props }) => (
  <UI.Box w="50%" mx={2} {...props}>
    {children}
  </UI.Box>
);
