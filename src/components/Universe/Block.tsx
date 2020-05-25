import { useColorMode, FlexProps, BoxProps } from '@chakra-ui/core';
import * as UI from '../ui';

export const Block: React.FC<FlexProps & { active?: boolean }> = ({
  active,
  ...other
}) => {
  const { colorMode } = useColorMode();
  return (
    <UI.Flex
      my={8}
      w="100%"
      position="relative"
      {...other}
      bg={
        colorMode === 'light'
          ? active
            ? 'gray.100'
            : 'gray.50'
          : active
          ? 'blackAlpha.600'
          : 'blackAlpha.400'
      }
      boxShadow={active ? 'sm' : null}
      flexDirection={['column', 'column', 'row', 'row']}
    />
  );
};

export const BlockEditorPane: React.FC<BoxProps> = ({ children, ...props }) => (
  <UI.Box
    w={['100%', '100%', '50%', '50%']}
    pl={4}
    pt={8}
    pb={6}
    pr={0}
    {...props}
  >
    <UI.Box ml={['-40px', 0, 0, 0]}>{children}</UI.Box>
  </UI.Box>
);

export const BlockPreviewPane: React.FC<
  BoxProps & {
    sticky?: boolean;
  }
> = ({ sticky, ...other }) => {
  const { colorMode } = useColorMode();
  return (
    <UI.Box
      w={['100%', '100%', '50%', '50%']}
      bg={colorMode === 'light' ? 'gray.100' : null}
      px={4}
      py={[4, 4, 0, 0]}
      overflow="auto"
      borderLeft="0.5rem solid"
      borderColor="gray.500"
      borderLeftWidth={['0.5rem', '0.5rem', 0, 0]}
      {...(sticky && {
        maxHeight: '90vh',
        position: 'sticky',
        top: '4.5rem',
      })}
      {...other}
    />
  );
};
