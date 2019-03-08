const _ = require("lodash");
const { config } = require("aom/mongoose");

exports.ensure = function(data) {
  const self = this;
  return self.findOne(data).then(result => {
    return result || self.create(data);
  });
};

// в будущем должно вызываться как
// ItemCategories.connect({category: %key% })
// и стать системной функцией для statics
/*
exports.connect = function(params) {
  const self = this;
  // return connector by keys and name
} */

exports.disable = function(where, multi = true) {
  const { disabled } = config;
  return this.update(where, { $set: disabled }, { multi });
};

exports.enable = function(where, multi = true) {
  const { enabled } = config;
  return this.update(where, { $set: enabled }, { multi });
};