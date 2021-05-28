module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['@babel/preset-env', 'react-app', '@linaria'],
    plugins: [],
  };
};
