import Link from 'next/link';
import { useRouter } from 'next/router';
import * as UI from './ui';

export const NavigationItem: React.FC<{ active?: boolean }> = ({
  active,
  children,
}) => (
  <UI.Link>
    <UI.Box py={2} fontWeight={active ? 700 : null}>
      {children}
    </UI.Box>
  </UI.Link>
);

export const Navigation: React.FC = () => {
  const { route } = useRouter();
  return (
    <UI.Flex
      direction="column"
      position="sticky"
      top="2rem"
      w="16rem"
      mt={8}
      px={6}
      py={2}
      bg="gray.100"
      rounded="lg"
    >
      <Link href="/">
        <NavigationItem active={route === '/'}>Home</NavigationItem>
      </Link>
      <Link href="/">
        <NavigationItem active={route === '/examples'}>Examples</NavigationItem>
      </Link>
    </UI.Flex>
  );
};
