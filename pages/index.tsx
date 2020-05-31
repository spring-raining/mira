import { useContext, useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import * as fs from 'fs';
import { setProjects } from '../src/actions/workspace';
import { Footer } from '../src/components/Footer';
import { Navigation } from '../src/components/Navigation';
import { NightSky } from '../src/components/NightSky';
import { Universe } from '../src/components/Universe';
import * as UI from '../src/components/ui';
import { WorkspaceContext } from '../src/contexts/workspace';
import HomeDoc from '../docs/index.mdx';

const defaultProjectName = 'asteroid';

interface PageProps {
  examples: { [name: string]: string };
}

export default ({ examples }: PageProps) => {
  const {
    state: { fs },
    dispatch,
  } = useContext(WorkspaceContext);
  const [initialMdx, setInitialMdx] = useState<string | null>(null);
  useEffect(() => {
    if (!fs || !dispatch) {
      return;
    }
    fs.listProjects()
      .then((projects) =>
        Promise.all(
          projects.map(async (project) => ({
            ...project,
            mdx: await fs.loadProject(project.name),
          }))
        )
      )
      .then((projects) => {
        const asteroidPrj = projects.find(
          ({ name }) => name === defaultProjectName
        );
        setInitialMdx(asteroidPrj?.mdx || examples[defaultProjectName]);
        dispatch(setProjects(projects));
      });
  }, [fs, dispatch]);

  return (
    <div>
      <Head>
        <title>Asteroid</title>
      </Head>

      <NightSky minH={['70vh', '80vmin', '60vmin', '60vmin']}>
        <UI.Box mx={6}>
          <UI.Heading>Asteroid</UI.Heading>
          <UI.Text fontSize="lg">
            JavaScript & Markdown live editor on your browser
          </UI.Text>
        </UI.Box>
        <UI.Flex
          justify={['center', 'center', 'flex-end', 'flex-end']}
          position="absolute"
          w="100%"
          bottom="1rem"
        >
          <UI.Image
            src="/assets/screenshot.png"
            height={[200, 240, 300, 300]}
            alt="Asteroid"
            mx="4rem"
            boxShadow="lg"
          />
        </UI.Flex>
      </NightSky>

      <UI.Flex
        direction={['column', 'column', 'row', 'row']}
        mx="auto"
        my={12}
        px={4}
      >
        <UI.Box>
          <Navigation />
        </UI.Box>
        <UI.Box flex={1} ml={[0, 0, 4, 4]}>
          <HomeDoc />
        </UI.Box>
      </UI.Flex>

      <UI.Flex my={12} justify="center" align="center">
        <UI.Icon name="arrow-down" size="1.5rem" />
        <UI.Text ml={2} fontSize="1.5rem">
          Try it now
        </UI.Text>
      </UI.Flex>

      {initialMdx != null && (
        <Universe projectName={defaultProjectName} mdx={initialMdx} />
      )}
      <Footer />
    </div>
  );
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const mdx = await fs.promises.readFile('public/examples/asteroid.mdx', {
    encoding: 'utf8',
  });
  return {
    props: {
      examples: {
        [defaultProjectName]: mdx,
      },
    },
  };
};
