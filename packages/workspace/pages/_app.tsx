import 'reflect-metadata';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { miraTheme } from '@mirajs/wui';
import App from 'next/app';
import type { AppProps, AppContext } from 'next/app';
import getConfig from 'next/config';
import React, { useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { container } from 'tsyringe';
import { getFileSystemRepository } from '../services/filesystem/fileSystem.impl.devSever';
import {
  fileSystemServiceToken,
  FileSystemService,
} from '../services/filesystem/fileSystem.trait';
import {
  WorkspaceRepository,
  WorkspaceService,
  workspaceServiceToken,
} from '../services/workspace/workspace.trait';
import '@mirajs/wui/styles.css';

const { serverRuntimeConfig = {} } = getConfig();
const theme = extendTheme(miraTheme);

export type AppCustomProps = {
  constants: WorkspaceRepository['constants'];
};

function MyApp({ Component, pageProps, constants }: AppProps & AppCustomProps) {
  // Register services on client-side only
  useEffect(() => {
    const importPath = constants.devServerWatcherImportPath;
    if (importPath) {
      container.register(fileSystemServiceToken, {
        useValue: new FileSystemService(
          getFileSystemRepository({
            devServerWatcherImportPath: importPath,
          }),
        ),
      });
    }
  }, [constants.devServerWatcherImportPath]);

  return (
    <RecoilRoot>
      <ChakraProvider {...{ theme }}>
        <Component {...pageProps} />
      </ChakraProvider>
    </RecoilRoot>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  if (
    !container.isRegistered(workspaceServiceToken) &&
    !serverRuntimeConfig.disableStandaloneMode
  ) {
    // const { getWorkspaceRepository } = await import(
    //   '../services/workspace/workspace.impl.standalone'
    // );
    // container.register(workspaceServiceToken, {
    //   useValue: new WorkspaceService(await getWorkspaceRepository()),
    // });
  }

  const workspace = container.resolve<WorkspaceService>(workspaceServiceToken);
  const appProps = await App.getInitialProps(appContext);
  return {
    constants: workspace.service.constants,
    ...appProps,
  };
};

export default MyApp;
