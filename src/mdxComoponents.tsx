import { ReactNode } from 'react';
import { MDXProviderComponents } from '@mdx-js/react';
import { css } from '@emotion/core';
import Highlight, { defaultProps, Language } from 'prism-react-renderer';
import lightTheme from 'prism-react-renderer/themes/nightOwlLight';
import * as UI from './components/ui';

const CodeBlock = ({
  children,
  className,
}: {
  children: ReactNode | ReactNode[];
  className?: string;
}) => {
  const language = (className || '').replace(/language-/, '') as Language;
  const code =
    typeof children === 'string'
      ? children
      : Array.isArray(children) && typeof children[0] === 'string'
      ? children[0]
      : null;
  if (code === null) {
    return null;
  }

  return (
    <Highlight
      {...defaultProps}
      code={code.trim()}
      language={language}
      theme={lightTheme}
    >
      {({ tokens, getLineProps, getTokenProps }) => (
        <>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </>
      )}
    </Highlight>
  );
};

const liStyle = css({
  '& > ul, & > ol': {
    paddingInlineStart: '1rem',
  },
});

export const mdxComponents: MDXProviderComponents = {
  wrapper: (props) => <UI.Box my={4} {...props} />,
  p: (props) => <UI.Text as="p" my={4} {...props} />,
  h1: (props) => <UI.Heading as="h1" size="2xl" mt={8} mb={4} {...props} />,
  h2: (props) => <UI.Heading as="h2" size="xl" mt={8} mb={4} {...props} />,
  h3: (props) => <UI.Heading as="h3" size="lg" mt={8} mb={4} {...props} />,
  h4: (props) => <UI.Heading as="h4" size="md" mt={8} mb={4} {...props} />,
  h5: (props) => <UI.Heading as="h5" size="sm" mt={8} mb={4} {...props} />,
  h6: (props) => <UI.Heading as="h6" size="xs" mt={8} mb={4} {...props} />,
  // thematicBreak?: ComponentType<any>;
  blockquote: (props) => (
    <UI.Callout
      as="blockquote"
      display="block"
      my={4}
      backgroundColor="blackAlpha.100"
      rounded="lg"
      {...props}
    />
  ),
  ul: (props) => <UI.List as="ul" styleType="disc" my={2} {...props} />,
  ol: (props) => <UI.List as="ol" styleType="decimal" my={2} {...props} />,
  li: (props) => <UI.ListItem as="li" css={liStyle} {...props} />,
  table: (props) => (
    <UI.Box as="table" my={4} w="full" textAlign="left" {...props} />
  ),
  // tr?: ComponentType<any>;
  th: ({ align, ...props }) => (
    <UI.Box as="th" p={2} fontSize="sm" textAlign={align} {...props} />
  ),
  td: ({ align, ...props }) => (
    <UI.Box
      as="td"
      p={2}
      borderTopWidth="1px"
      borderColor="currentColor"
      fontSize="sm"
      whiteSpace="normal"
      textAlign={align}
      {...props}
    />
  ),
  pre: (props) => <UI.Box as="pre" my={4} {...props} />,
  code: (props) => (
    <UI.Code
      w="full"
      px={4}
      py={6}
      rounded="lg"
      fontSize="xs"
      lineHeight={1.4}
      overflowX="auto"
    >
      <CodeBlock {...props} />
    </UI.Code>
  ),
  // em?: ComponentType<any>;
  // strong?: ComponentType<any>;
  // delete?: ComponentType<any>;
  inlineCode: (props) => <UI.Code fontSize="sm" mx={1} {...props} />,
  hr: (props) => (
    <UI.Box
      as="hr"
      borderTopWidth="1px"
      borderColor="currentColor"
      my={4}
      {...props}
    />
  ),
  a: (props) => <UI.Link color="blue.500" {...props} />,
  // img?: ComponentType<any>;
};
