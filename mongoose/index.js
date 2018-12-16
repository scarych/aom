exports.config = {
  enabled: { "is.enabled": true },
  disabled: { "is.enabled": false },
  updated: function() {
    return { is: { updated: new Date() } };
  }
};

exports.aggregators = require("./aggregators");
exports.schemas = require("./schemas");
exports.statics = require("./statics");
exports.methods = require("./methods");
