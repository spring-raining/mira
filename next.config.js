const withMDX = require('@next/mdx')();

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
