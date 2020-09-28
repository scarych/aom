const _ = require("lodash");
const { connector } = require("./aggregators");
/** find or create document by condition with specific data */
exports.ensure = function (where, data) {
	const self = this;
	return self.findOne(where).then((result) => {
		return result || self.create(_.merge(where, data));
	});
};

/** fast aggregate data to set by attribute and return list of values */
exports.aggregateToSet = function (where, attr = "_id") {
	return this.aggregate([
		{ $match: where },
		{ $group: { _id: `set_${attr}`, set: { $addToSet: `$${attr}` } } },
	]).then((result) => _.toArray(_.get(_.first(result), "set")));
};

/** add join posibility to model */
exports.join = function (name, key) {
	const link = {};
	if (_.isObject(name) && !key) {
		const [_name] = _.keys(name);
		const [_key] = _.values(name);
		name = _name;
		key = _key;
	}
	link[this.modelName] = name;
	return connector(link, key);
};
