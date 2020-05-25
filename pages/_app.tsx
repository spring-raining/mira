import React from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider, ColorModeProvider, CSSReset } from '@chakra-ui/core';
import { MDXProvider } from '@mdx-js/react';
import theme from '../src/theme';

const MyApp = ({ Component, pageProps }: AppProps) => (
  <MDXProvider components={{}}>
    <ThemeProvider theme={theme}>
      <ColorModeProvider value="light">
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap"
            rel="stylesheet"
          />
        </Head>
        <CSSReset />
        <Component {...pageProps} />
      </ColorModeProvider>
    </ThemeProvider>
  </MDXProvider>
);

export default MyApp;
