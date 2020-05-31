import { useContext, useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import styled from '@emotion/styled';
import { useColorMode } from '@chakra-ui/core';
import * as fs from 'fs';
import { setProjects } from '../src/actions/workspace';
import { Footer } from '../src/components/Footer';
import { Navigation } from '../src/components/Navigation';
import { Universe } from '../src/components/Universe';
import * as UI from '../src/components/ui';
import { WorkspaceContext } from '../src/contexts/workspace';
import HomeDoc from '../docs/index.mdx';

const defaultProjectName = 'asteroid';

const StyledIntro = styled(UI.Box)<{
  colorMode: 'light' | 'dark';
}>(({ colorMode }) => {
  const hsl = colorMode === 'light' ? '0,0%,100%' : '220,26%,14%';
  const orbit = 'rgba(255,255,255,0.2)';
  return {
    position: 'relative',
    background: `
    radial-gradient(circle at 100% -20%, transparent 20rem, ${orbit} 20rem, ${orbit} calc(20rem + 1px), transparent calc(20rem + 1px)),
    radial-gradient(ellipse at top left, #00031f, rgba(0, 17, 64, 0.9) 50%, transparent),
    radial-gradient(ellipse at top right, #25006f, #7330ff 83%)`,
    color: 'white',
    '::after': {
      content: '""',
      position: 'absolute',
      height: '30%',
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(
        to bottom,
        hsla(${hsl}, 0) 0%,
        hsla(${hsl}, 0.013) 6.5%,
        hsla(${hsl}, 0.049) 12.8%,
        hsla(${hsl}, 0.104) 19%,
        hsla(${hsl}, 0.175) 25.2%,
        hsla(${hsl}, 0.259) 31.3%,
        hsla(${hsl}, 0.352) 37.4%,
        hsla(${hsl}, 0.45) 43.5%,
        hsla(${hsl}, 0.55) 49.8%,
        hsla(${hsl}, 0.648) 56.2%,
        hsla(${hsl}, 0.741) 62.7%,
        hsla(${hsl}, 0.825) 69.6%,
        hsla(${hsl}, 0.896) 76.6%,
        hsla(${hsl}, 0.951) 84%,
        hsla(${hsl}, 0.987) 91.8%,
        hsl(${hsl}) 100%
      )`,
    },
  };
});

interface PageProps {
  examples: { [name: string]: string };
}

export default ({ examples }: PageProps) => {
  const {
    state: { fs },
    dispatch,
  } = useContext(WorkspaceContext);
  const { colorMode } = useColorMode();
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

      <StyledIntro
        colorMode={colorMode}
        w="100%"
        py={12}
        minH={['70vh', '70vmin', '70vmin', '70vmin']}
      >
        <UI.Box mx={6}>
          <UI.Heading>Asteroid</UI.Heading>
          <UI.Text fontSize="lg">
            JavaScript & Markdown live editor on your browser
          </UI.Text>
        </UI.Box>
      </StyledIntro>

      <UI.Flex mx="auto" my={12} px={4}>
        <UI.Box>
          <Navigation />
        </UI.Box>
        <UI.Box flex={1} ml={4}>
          <HomeDoc />
        </UI.Box>
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
