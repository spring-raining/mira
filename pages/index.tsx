import Head from 'next/head';
import { Universe } from '../src/components/Universe';

const text = `
\`\`\`js asteroid=1998SF37
await new Promise(res => setTimeout(res, 1000))
$run(() => (
  <div>Y</div>
))
return { x: 'x' }
\`\`\`

<div><Asteroid_1998SF37/></div>

\`\`\`js asteroid=1998SF39
await new Promise(res => setTimeout(res, 1000))
$run(() => (
  <div>{x}</div>
))
\`\`\`

<div><Asteroid_1998SF39/></div>

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

<div><Asteroid_1998SF36/></div>
`;

export default () => {
  return (
    <div className="container">
      <Head>
        <title>Asteroid</title>
      </Head>
      <Universe mdx={text} />
    </div>
  );
};
