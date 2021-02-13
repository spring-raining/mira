import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as UI from '../../src/components/ui';

export default () => {
  const router = useRouter();
  const { title } = router.query;
  const Asteroid = dynamic(() => import(`../../public/examples/${title}.mdx`), {
    ssr: false,
  });

  return (
    <div>
      <Head>
        <title>Asteroid</title>
      </Head>
      <UI.Box maxW={920} mx="auto" px={[2, 4, 4, 4]}>
        <Asteroid />
      </UI.Box>
    </div>
  );
};
