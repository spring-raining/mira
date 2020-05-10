import Head from 'next/head';
import { Universe } from '../src/components/Universe';
import * as UI from '../src/components/ui';

const text = `
# Asteroid

\`\`\`js asteroid=1998SF37
await new Promise(res => setTimeout(res, 1000))
$run(() => (
  <div>Y</div>
))
return { x: 'x' }
\`\`\`

<div><Asteroid_1998SF37 /></div>

<div></div>

\`\`\`js asteroid=1998SF39
await new Promise(res => setTimeout(res, 1000))
$run(() => (
  <div>{x}</div>
))
\`\`\`

<div><Asteroid_1998SF39 /></div>

import paper from 'https://unpkg.com/@asteroid-pkg/paper@0.12.4?module';

\`\`\`js asteroid=1998SF36
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
      <Universe mdx={text} />
    </div>
  );
};
