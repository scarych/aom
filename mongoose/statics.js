const _ = require("lodash");
const { config } = require("aom/mongoose");
const { connector } = require('./aggregators');
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

/** выполняет быстрый join данной таблицы, заменяя собой команду connector */
exports.join = function(name, key) {
  const link = {};
  link[this.modelName] = name;
  return connector(link, key);
}

/** набор типовых middleware функций  */
exports._id = '_id';
const ctx = {};

/** возвращает middleware, позволяющий 
 * быстро извлечь элемент по имени _id и значению в ctx.params
 * из существующей модели model, и поместить его в состояние по имени attr
 * если attr не задан, то из текста _id извлекается все, кроме окончания 
 * exports._id, который в общем случае можно "заменять" (например, на Id);
 * использует where для уточнения запроса
*/
ctx._id = function(_id, attr, where={}) {
  const model = this;
  if (!attr) attr=_id.substr(0, _id.length-exports._id.length);
  return async ({params, state}, next) => {
    where._id = params[_id];
    state[attr] = await model.findOne(where);
    return state[attr] && next();
  }
}

