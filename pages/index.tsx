import Head from 'next/head';
import { Universe } from '../src/components/Universe';

const text = `
\`\`\`js asteroid=1998SF36
const a = '123';
$run(() => (
  <div>{a}</div>
))
\`\`\`
\`\`\`js asteroid=1998SF37
$run(() => (
  <div>Y</div>
))
\`\`\`
\`\`\`js asteroid=1998SF39
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
