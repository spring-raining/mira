const { mdxOptions } = require('@asteroid-pkg/mdx');

const withMDX = require('@next/mdx')({
  options: mdxOptions,
});

module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  webpack(config, { isServer }) {
    if (!isServer) {
      config.node = {
        fs: 'empty',
      };
    }
    return config;
  },
});
