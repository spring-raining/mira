import Head from 'next/head';
import { useRouter } from 'next/router';
import { Footer } from '../src/components/Footer';
import { Navigation } from '../src/components/Navigation';
import { NightSky } from '../src/components/NightSky';
import * as UI from '../src/components/ui';

const examples = [
  { slag: 'asteroid', name: 'Asteroid introduction' },
  { slag: 'markdown', name: 'Markdown preview' },
  { slag: 'threejs', name: 'Three.js example' },
];

export default () => {
  const router = useRouter();

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

      <UI.Flex
        direction={['column', 'column', 'row', 'row']}
        mx="auto"
        px={[2, 4, 4, 4]}
      >
        <UI.Box>
          <Navigation />
        </UI.Box>
        <UI.Box flex={1} ml={[0, 0, 4, 4]} mt={8}>
          <UI.Heading as="h1" size="2xl">
            Examples
          </UI.Heading>
          <UI.SimpleGrid minChildWidth="16rem" spacing="2rem" mt={8}>
            {examples.map(({ slag, name }) => (
              <UI.Flex
                direction="column"
                key={slag}
                borderWidth="1px"
                rounded="lg"
                overflow="hidden"
              >
                <UI.Box
                  h={140}
                  backgroundColor="gray.200"
                  cursor="pointer"
                  onClick={() => {
                    router.push('/workspace/[title]', `/workspace/${slag}`);
                  }}
                ></UI.Box>
                <UI.Box p={6}>
                  <UI.Heading size="sm">{name}</UI.Heading>
                  <UI.Text mt={3}>
                    <UI.Link
                      href="/examples/[title]"
                      as={`/examples/${slag}`}
                      textDecoration="underline"
                    >
                      Go to rendered page
                    </UI.Link>
                  </UI.Text>
                </UI.Box>
              </UI.Flex>
            ))}
          </UI.SimpleGrid>
        </UI.Box>
      </UI.Flex>

      <Footer />
    </div>
  );
};
