import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as fs from 'fs';
import { Footer } from '../../src/components/Footer';
import { Universe } from '../../src/components/Universe';

interface PageProps {
  mdx: string;
}

export default ({ mdx }: PageProps) => {
  const router = useRouter();
  const title = router.query.title as string;

  return (
    <div>
      <Head>
        <title>Asteroid</title>
      </Head>
      <Universe projectName={`${title}-demo`} mdx={mdx} />
      <Footer />
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const examples = (await fs.promises.readdir('public/examples'))
    .filter((f) => /\.mdx$/.test(f))
    .map((f) => f.replace('.mdx', ''));
  return {
    paths: examples.map((title) => ({ params: { title } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({
  params = {},
}) => {
  const title = params.title as string;
  const mdx = await fs.promises.readFile(`public/examples/${title}.mdx`, {
    encoding: 'utf8',
  });
  return { props: { mdx } };
};
