const { config } = require("aom/mongoose");
const _ = require("lodash");

exports.update = function() {
  const { updated } = config;
  _.merge(this, updated());
  return this.save();
};
