import Head from 'next/head';
import { Universe } from '../src/components/Universe';

const text = `
\`\`\`js asteroid=1998SF36
await new Promise(res => setTimeout(res, 1000))
$run(() => (
  <div>Y</div>
))
\`\`\`
\`\`\`js asteroid=1998SF37
await new Promise(res => setTimeout(res, 1000))
$run(() => (
  <div>Y</div>
))
return { x: 'x' }
\`\`\`
\`\`\`js asteroid=1998SF39
await new Promise(res => setTimeout(res, 1000))
$run(() => (
  <div>Y</div>
))
\`\`\`
`;

export default () => {
  return (
    <div className="container">
      <Head>
        <title>Asteroid</title>
      </Head>
      <Universe code={text} />
    </div>
  );
};
