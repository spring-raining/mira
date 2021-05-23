import { AsteroidWui, theme } from '@asteroid-mdx/wui';
import { ThemeProvider, toCSSVar } from '@chakra-ui/react';
import { Global, css } from '@emotion/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useCallback } from 'react';
import { container } from 'tsyringe';
import { workspaceServiceToken, WorkspaceService } from '../services/workspace';
import { AsteroidFileItem } from '../types/workspace';

interface PageProps {
  file: AsteroidFileItem<number> | null;
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context
) => {
  const cli = container.resolve<WorkspaceService>(workspaceServiceToken);
  const asteroid = (await cli.service.getAsteroidFiles()).map((it) => ({
    ...it,
    mtime: it.mtime.getTime(),
    birthtime: it.mtime.getTime(),
  }));
  const filepath = context.query['mdx'];
  const filepathStr =
    filepath && Array.isArray(filepath) ? filepath[0] : filepath;
  const file =
    (filepathStr &&
      asteroid.find((f) => f.path === decodeURIComponent(filepathStr))) ||
    null;
  return {
    props: { file },
  };
};

export default function Home({ file }: PageProps) {
  const moduleLoader = useCallback(async (specifier: string) => {
    const mod = await import(/* webpackIgnore: true */ specifier);
    return mod;
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>{file?.path ?? 'Universe'}</title>
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
      <AsteroidWui
        mdx={file?.body ?? undefined}
        path={file?.path}
        depsRootPath={file?.depsRootPath}
        moduleLoader={moduleLoader}
        onUpdate={(mdx) => {
          console.debug(mdx);
        }}
      />
    </ThemeProvider>
  );
}
