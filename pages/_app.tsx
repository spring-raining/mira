import React from 'react';
import { AppProps } from 'next/app';
import { MDXProvider } from '@mdx-js/react';
import { CodeBlock } from '../src/components/CodeBlock';

const components = {
  // pre: (props) => <div {...props} />,
  // code: CodeBlock,
};

const MyApp = ({ Component, pageProps }: AppProps) => (
  <MDXProvider components={components}>
    <Component {...pageProps} />
  </MDXProvider>
);

export default MyApp;
