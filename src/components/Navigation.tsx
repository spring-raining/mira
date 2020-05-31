import Link from 'next/link';
import { useRouter } from 'next/router';
import * as UI from './ui';

export const NavigationItem: React.FC<{ active?: boolean }> = ({
  active,
  children,
}) => (
  <UI.Box py={2} fontWeight={active ? 700 : null}>
    {children}
  </UI.Box>
);

export const Navigation: React.FC = () => {
  const { route } = useRouter();
  return (
    <UI.Flex
      direction="column"
      position={['relative', 'relative', 'sticky', 'sticky']}
      top={[0, 0, '2rem', '2rem']}
      w={['100%', '100%', '16rem', '16rem']}
      mt={8}
      px={6}
      py={2}
      bg="gray.100"
      rounded="lg"
    >
      <UI.Link href="/">
        <NavigationItem active={route === '/'}>Home</NavigationItem>
      </UI.Link>
      <UI.Link href="/examples">
        <NavigationItem active={route === '/examples'}>Examples</NavigationItem>
      </UI.Link>
      <UI.Link href="/workspace">
        <NavigationItem>Workspace</NavigationItem>
      </UI.Link>
    </UI.Flex>
  );
};
