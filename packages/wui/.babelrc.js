module.exports = (api) => ({
  presets:['react-app'],
  plugins: api.env('production')
    ? [
        [
          'lightwindcss/babel',
          {
            analysisFile: './lightwindcss.json',
          },
        ],
      ]
    : [],
});
