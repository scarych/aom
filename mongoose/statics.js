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

/** набор типовых middleware функций  */
exports._id = '_id';
const ctx = {};

/** возвращает middleware, позволяющий 
 * быстро извлечь элемент по имени _id и значению в ctx.params
 * из существующей модели model, и поместить его в состояние по имени attr
 * если attr не задан, то из текста _id извлекается все, кроме окончания 
 * exports._id, который в общем случае можно "заменять" (например, на Id);
*/
ctx._id = function(_id, attr) {
  const model = this;
  if (!attr) attr=_id.substr(0, _id.length-exports._id.length);
  return async ({params, state}, next) => {
    state[attr] = await model.findOne({_id: params[_id]});
    return state[attr] && next();
  }
}

exports.ctx = ctx;
