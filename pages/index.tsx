import Head from 'next/head';
import { Universe } from '../src/components/Universe';

const text = `
## test

this is the test

#### foo

\`\`\`js asteroid=1998SF36
$run(() => (
  <div>X</div>
))
\`\`\`

<Code>{
$run(() => (
  <button>foo</button>
))
}</Code>
`;

export default () => {
  return (
    <div className="container">
      <Head>
        <title>Asteroid</title>
      </Head>

      <Universe code={text} />

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
            Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue,
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};
