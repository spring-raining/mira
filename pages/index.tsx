import Head from 'next/head';
import { Universe } from '../src/components/Universe';
import * as UI from '../src/components/ui';
import pkg from '../package.json';

const mdx = `
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




<div></div>

\`\`\`jsx asteroid=1998SF39
await $run(() => x)
\`\`\`

<div><Asteroid_1998SF39 /></div>




import paper from 'https://unpkg.com/@asteroid-pkg/paper@0.12.4?module';

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

export default () => {
  return (
    <div>
      <Head>
        <title>Asteroid</title>
      </Head>

      <UI.Box mx={6} my={12} minH="30vmin">
        <UI.Heading>Asteroid</UI.Heading>
        <UI.Text fontSize="lg">
          JavaScript & Markdown live editor on your browser
        </UI.Text>
      </UI.Box>
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
