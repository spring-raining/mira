import Head from 'next/head';
import { Footer } from '../src/components/Footer';
import { Navigation } from '../src/components/Navigation';
import { NightSky } from '../src/components/NightSky';
import * as UI from '../src/components/ui';
import HomeDoc from '../docs/index.mdx';

interface PageProps {
  examples: { [name: string]: string };
}

export default () => {
  return (
    <div>
      <Head>
        <title>Asteroid</title>
      </Head>

      <NightSky pb="4rem">
        <UI.Box mx={6}>
          <UI.Heading>Asteroid</UI.Heading>
          <UI.Text fontSize="lg">
            JavaScript & Markdown live editor on your browser
          </UI.Text>
        </UI.Box>
      </NightSky>

      <UI.Flex direction={['column', 'column', 'row', 'row']} mx="auto" px={4}>
        <UI.Box>
          <Navigation />
        </UI.Box>
        <UI.Box flex={1} ml={[0, 0, 4, 4]} mt={8}>
          <UI.Heading as="h1" size="2xl">
            Examples
          </UI.Heading>
        </UI.Box>
      </UI.Flex>

      <Footer />
    </div>
  );
};
