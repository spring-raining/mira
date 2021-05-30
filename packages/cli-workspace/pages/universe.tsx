import {
  AsteroidWui,
  theme,
  UniverseProvider,
  useUniverseContext,
  RefreshModuleEvent,
} from '@asteroid-mdx/wui';
import { ThemeProvider, toCSSVar } from '@chakra-ui/react';
import { Global, css } from '@emotion/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import React, { useCallback, useEffect } from 'react';
import { container } from 'tsyringe';
import {
  workspaceServiceToken,
  WorkspaceService,
  WorkspaceRepository,
} from '../services/workspace';
import { AsteroidMdxFileItem } from '../types/workspace';

interface PageProps {
  file: AsteroidMdxFileItem<number> | null;
  constants: WorkspaceRepository['constants'];
}

const UniverseView: React.VFC<PageProps> = ({
  file,
  constants: { hmrUpdateEventName },
}) => {
  const moduleLoader = useCallback(async (specifier: string) => {
    const mod = await import(/* webpackIgnore: true */ specifier);
    return mod;
  }, []);
  const { refreshModule } = useUniverseContext();
  useEffect(() => {
    const fn = (event: CustomEvent<RefreshModuleEvent>) => {
      refreshModule(event.detail);
    };
    window.addEventListener(hmrUpdateEventName, fn as EventListener);
    return () =>
      window.removeEventListener(hmrUpdateEventName, fn as EventListener);
  }, []);

  return (
    <AsteroidWui
      mdx={file?.body ?? undefined}
      path={file?.path}
      depsRootPath={file?.depsRootPath}
      moduleLoader={moduleLoader}
      onUpdate={(mdx) => {
        console.debug(mdx);
      }}
    />
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context
) => {
  const cli = container.resolve<WorkspaceService>(workspaceServiceToken);
  const asteroid = await cli.service.getAsteroidFiles();
  const filepath = context.query['mdx'];
  const filepathStr =
    filepath && Array.isArray(filepath) ? filepath[0] : filepath;
  const file =
    (filepathStr &&
      asteroid.find((f) => f.path === decodeURIComponent(filepathStr))) ||
    null;
  return {
    props: { file, constants: cli.service.constants },
  };
};

export default function Home({ file, constants }: PageProps) {
  return (
    <ThemeProvider theme={theme}>
      <UniverseProvider>
        <Head>
          <title>{file?.path ?? 'Universe'}</title>
          <script type="module" src={constants.hmrPreambleImportPath} />
        </Head>
        <Global
          styles={css`
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
            }
          `}
        />
        <UniverseView {...{ file, constants }} />
      </UniverseProvider>
    </ThemeProvider>
  );
}
