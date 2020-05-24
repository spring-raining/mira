import React, { useEffect, useContext, useReducer } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { ThemeProvider, ColorModeProvider, CSSReset } from '@chakra-ui/core';
import { MDXProvider } from '@mdx-js/react';
import {
  WorkspaceContext,
  workspaceContextReducer,
  workspaceContextInitialState,
} from '../src/contexts/workspace';
import theme from '../src/theme';

const withGlobalProvider = (App: React.ComponentType<AppProps>) => (
  appProps: AppProps
) => {
  const [state, dispatch] = useReducer(
    workspaceContextReducer,
    workspaceContextInitialState
  );
  return (
    <MDXProvider components={{}}>
      <ThemeProvider theme={theme}>
        <ColorModeProvider value="light">
          <WorkspaceContext.Provider value={{ state, dispatch }}>
            <App {...appProps} />
          </WorkspaceContext.Provider>
        </ColorModeProvider>
      </ThemeProvider>
    </MDXProvider>
  );
};

const MyApp: React.FC<AppProps> = ({ Component, pageProps }: AppProps) => {
  const {
    state: { fs },
  } = useContext(WorkspaceContext);
  useEffect(() => {
    if (process.browser) {
      fs.init('asteroidfs');
    }
  }, []);

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <CSSReset />
      <Component {...pageProps} />
    </>
  );
};

export default withGlobalProvider(MyApp);
