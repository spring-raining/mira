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
      <Link href="/">
        <a>
          <NavigationItem active={route === '/'}>Home</NavigationItem>
        </a>
      </Link>
      <Link href="/examples">
        <a>
          <NavigationItem active={route === '/examples'}>
            Examples
          </NavigationItem>
        </a>
      </Link>
      <Link href="/workspace">
        <a>
          <NavigationItem>Workspace</NavigationItem>
        </a>
      </Link>
    </UI.Flex>
  );
};
