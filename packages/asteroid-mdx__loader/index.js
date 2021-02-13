const { compileSync, mdxOptions } = require('@asteroid-mdx/core');
const loaderUtils = require('loader-utils');

module.exports = function (content) {
  const callback = this.async();
  const options = Object.assign(
    {},
    mdxOptions,
    loaderUtils.getOptions(this)
  );

  let result;
  try {
    result = compileSync(content, options);
  } catch (err) {
    return callback(err);
  }
  return callback(null, result);
};
