import Head from 'next/head';
import styled from '@emotion/styled';
import { useColorMode } from '@chakra-ui/core';
import { Universe } from '../src/components/Universe';
import * as UI from '../src/components/ui';
import pkg from '../package.json';

const mdx = `
import paper from 'https://unpkg.com/@asteroid-pkg/paper@0.12.4?module'

# Asteroid

Jupyter-like JavaScript REPL editor

![](https://media.giphy.com/media/W5g5W5hMkzrJQDpN3P/giphy.gif)

\`\`\`jsx asteroid=1998SF37
await $run(() => (
  <p style={{padding: 8, fontSize: 30, background: 'orange'}}>
    Asteroid renders React components!
  </p>
))

return { x: 'word' }
\`\`\`

<div><Asteroid_1998SF37 /></div>

\`\`\`jsx asteroid=1998SF39
await $run(() => x)
\`\`\`

<div><Asteroid_1998SF39 /></div>

\`\`\`jsx asteroid=1998SF36
await $run(() => <canvas id="canvas" />);

const canvas = document.getElementById('canvas');
paper.setup(canvas);
const path = new paper.Path();
path.strokeColor = "black";
var start = new paper.Point(100, 100);
path.moveTo(start);
path.lineTo(start.add([200, -50]));
\`\`\`

<div><Asteroid_1998SF36 /></div>


\`\`\`jsx asteroid=1958PG15
const {Path} = paper;
await $run(() => <canvas id="canvas2" />);

const canvas = document.getElementById('canvas2');
paper.setup(canvas);

var path = new Path.Rectangle({
	point: [30, 30],
	size: [75, 75],
	strokeColor: 'black',
	fillColor: 'red',
});

paper.view.onFrame = (event) => {
	path.rotate(3);
	path.fillColor.hue += 1;
}
\`\`\`

<div><Asteroid_1958PG15 /></div>


`;

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

export default () => {
  const { colorMode } = useColorMode();
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
      <Universe mdx={mdx} />
      <UI.Flex w="100%" my={12} justify="center">
        <UI.Box mx={2}>Asteroid v{pkg.version}</UI.Box>/
        <UI.Box mx={2}>
          <UI.Link href="https://github.com/spring-raining/asteroid" isExternal>
            Code
          </UI.Link>
        </UI.Box>
        /
        <UI.Box mx={2}>
          ©&nbsp;
          <UI.Link href="https://github.com/spring-raining" isExternal>
            spring-raining
          </UI.Link>
        </UI.Box>
      </UI.Flex>
    </div>
  );
};
