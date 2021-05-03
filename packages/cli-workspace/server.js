const next = require('next');

module.exports = (options = {}) => next({
  dir: __dirname,
  ...options,
});
