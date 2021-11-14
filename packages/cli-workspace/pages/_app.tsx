import 'reflect-metadata';
import { theme } from '@mirajs/wui';
import { ChakraProvider } from '@chakra-ui/react';
import App from 'next/app';
import type { AppProps, AppInitialProps, AppContext } from 'next/app';
import { useEffect } from 'react';
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
// import '@mirajs/wui/styles.css';

export type AppCustomProps = {
  constants: WorkspaceRepository['constants'];
};

function MyApp({ Component, pageProps, constants }: AppProps & AppCustomProps) {
  // Register services on client-side only
  useEffect(() => {
    container.register(fileSystemServiceToken, {
      useValue: new FileSystemService(getFileSystemRepository(constants)),
    });
  }, [constants]);

  return (
    <RecoilRoot>
      <ChakraProvider {...{ theme }}>
        <Component {...pageProps} />
      </ChakraProvider>
    </RecoilRoot>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const workspace = container.resolve<WorkspaceService>(workspaceServiceToken);
  const appProps = await App.getInitialProps(appContext);
  return {
    constants: workspace.service.constants,
    ...appProps,
  };
};

export default MyApp;
