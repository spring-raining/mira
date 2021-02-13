import { forwardRef } from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { PseudoBox, LinkProps } from '@chakra-ui/core';

const BareLink = forwardRef<any, LinkProps>(
  ({ isExternal, isDisabled, onClick, ...other }, ref) => {
    const externalProps = isExternal
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : null;
    return (
      <PseudoBox
        as="a"
        ref={ref}
        tabIndex={isDisabled ? -1 : undefined}
        aria-disabled={isDisabled}
        onClick={isDisabled ? (event) => event.preventDefault() : onClick}
        outline="none"
        cursor="pointer"
        _hover={{ textDecoration: 'underline' }}
        _focus={{
          boxShadow: 'outline',
        }}
        {...externalProps}
        {...other}
      />
    );
  }
);
export const Link: React.FC<
  Omit<NextLinkProps, 'href' | 'passHref'> & Omit<LinkProps, 'as'>
> = ({ href, as, replace, scroll, shallow, prefetch, ...props }) =>
  href?.startsWith('/') ? (
    <NextLink {...{ href, as, replace, scroll, shallow, prefetch }} passHref>
      <BareLink {...props} />
    </NextLink>
  ) : (
    <BareLink href={href} {...props} />
  );

export {
  Box,
  Button,
  Callout,
  Code,
  Flex,
  Grid,
  Heading,
  Icon,
  IconButton,
  Input,
  Image,
  // Link,
  List,
  ListItem,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  useTheme,
} from '@chakra-ui/core';
