import { AsteroidWui } from '@asteroid-mdx/wui';
import { Global, css } from '@emotion/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
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
    filepathStr &&
    asteroid.find((f) => f.path === decodeURIComponent(filepathStr)) || null;
  return {
    props: { file },
  };
};

export default function Home({ file }: PageProps) {
  return (
    <>
      <Head>
        <title>{file?.path ?? 'Universe'}</title>
      </Head>
      <Global styles={css`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
        }
      `} />
      <AsteroidWui mdx={file?.body ?? undefined} onUpdate={(mdx) => {
        console.debug(mdx);
      }} />
    </>
  );
}
