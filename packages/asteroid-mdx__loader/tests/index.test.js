import path from 'path';
import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';

const transform = (entry) => {
  const compiler = webpack({
    context: __dirname,
    entry,
    output: {
      path: path.resolve(__dirname, './dist'),
    },
    mode: 'none',
    module: {
      rules: [
        {
          test: /\.mdx$/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                configFile: false,
                plugins: [
                  '@babel/plugin-transform-runtime',
                  '@babel/plugin-syntax-jsx',
                  '@babel/plugin-transform-react-jsx',
                ],
              },
            },
            { loader: path.resolve(__dirname, '../index.js') },
          ],
        },
      ],
    },
    resolve: {
      alias: {
        '@asteroid-mdx/mock': path.resolve(
          __dirname,
          'asteroid-framework-mock.js'
        ),
      },
    },
  });
  const fs = createFsFromVolume(new Volume());
  compiler.outputFileSystem = fs

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else if (stats.hasErrors()) {
        reject(stats.toJson().errors);
      } else {
        resolve([
          stats,
          fs.readFileSync(path.resolve(__dirname, './dist/main.js'), 'utf8'),
        ]);
      }
    });
  });
};

const run = (value) => {
  return new Function(value)();
};

it('loader works well', async () => {
  const entry = path.resolve(__dirname, './test.mdx');
  const [stats, output] = await transform(entry);
  const value =
    'return ' + output.replace(/__webpack_require__\(0\)/, 'return $&');
  const ret = run(value);
  expect(ret.Asteroid_1998SF36()).toMatchObject({ framework: 'mock' });
});
