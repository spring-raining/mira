import React from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider, CSSReset } from '@chakra-ui/core';
import { MDXProvider } from '@mdx-js/react';

const MyApp = ({ Component, pageProps }: AppProps) => (
  <MDXProvider>
    <ThemeProvider>
      <CSSReset />
      <Component {...pageProps} />
    </ThemeProvider>
  </MDXProvider>
);

export default MyApp;
