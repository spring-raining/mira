module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['@babel/preset-env', 'react-app', '@linaria'],
    plugins: [
      ['@babel/plugin-proposal-private-methods', { loose: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
    ],
  };
};
