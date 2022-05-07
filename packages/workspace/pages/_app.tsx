import 'reflect-metadata';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { miraTheme } from '@mirajs/wui';
import App from 'next/app';
import type { AppProps, AppContext } from 'next/app';
import React, { useEffect } from 'react';
import { RecoilRoot } from 'recoil';
import { container } from 'tsyringe';
import { ServiceProvider, useServiceContext } from '../hooks/useServiceContext';
import { getFileSystemRepository } from '../services/filesystem/fileSystem.impl.devSever';
import { FileSystemService } from '../services/filesystem/fileSystem.trait';
import { getWorkspaceRepository } from '../services/workspace/workspace.impl.devServer';
import {
  WorkspaceService,
  workspaceServiceToken,
} from '../services/workspace/workspace.trait';
import '@mirajs/wui/styles.css';

const theme = extendTheme(miraTheme);

export type AppCustomProps = {
  workspaceData?: Parameters<typeof getWorkspaceRepository>[0];
};

const AppInitializer: React.VFC<AppCustomProps> = ({ workspaceData }) => {
  const { register } = useServiceContext();
  // Register services on client-side only
  useEffect(() => {
    if (workspaceData) {
      register(
        'workspace',
        new WorkspaceService(getWorkspaceRepository(workspaceData)),
      );
    }
    const importPath = workspaceData?.constants.devServerWatcherImportPath;
    if (importPath) {
      register(
        'fileSystem',
        new FileSystemService(
          getFileSystemRepository({
            devServerWatcherImportPath: importPath,
          }),
        ),
      );
    }
  }, [workspaceData, register]);

  return null;
};

function MyApp({
  Component,
  pageProps,
  workspaceData,
}: AppProps & AppCustomProps) {
  return (
    <RecoilRoot>
      <ServiceProvider>
        <ChakraProvider {...{ theme }}>
          <AppInitializer {...{ workspaceData }} />
          <Component {...pageProps} />
        </ChakraProvider>
      </ServiceProvider>
    </RecoilRoot>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  if (!container.isRegistered(workspaceServiceToken)) {
    return { ...appProps };
  }
  const workspace = container.resolve<WorkspaceService>(workspaceServiceToken);
  const { workspaceDirname, constants } = workspace.service;
  return {
    ...appProps,
    workspaceData: {
      initialMiraFiles: await workspace.service.getMiraFiles(),
      workspaceDirname,
      constants,
    },
  };
};

export default MyApp;
