const _ = require("lodash");
const { models, Types } = require("mongoose");
const { ObjectId } = Types;

// convert some value to objectId
exports.objective = (value) => {
	try {
		value = ObjectId(`${value}`);
	} catch (e) {
		value = undefined;
	}
	return value;
};

// pager for mongo aggregator
exports.pager = (params) => {
	let pager = [];
	if (params.total) {
		pager.push({ $group: { _id: "total", count: { $sum: 1 } } });
	} else if (_.toSafeInteger(params.limit) > 0) {
		const offset = _.toSafeInteger(params.offset);
		const limit = _.toSafeInteger(params.limit);
		pager.push({ $skip: offset < 0 ? 0 : offset }, { $limit: limit });
	} else {
	}
	return pager;
};

// make sort list by string ?[+|-]field
// default +
exports.sorter = (params) => {
	const sort = {};
	const isPlus = params.order[0] == "+";
	const isMinus = params.order[0] == "-";
	const direction = isMinus ? -1 : 1;
	const order = params.order.substr(isPlus || isMinus ? 1 : 0);
	sort[order] = direction;
	return sort;
};

// models connectors for aggregator
exports.connector = (link, key) => {
	// compatible for most possible variations
	const unwind = !_.isArray(key);
	_.isArray(key) && (key = key.shift());
	_.isString(key) && (key = { _id: key });
	let aggregate = [];
	for (const modelName in link) {
		const alias = link[modelName];
		const aliases = {};
		const $and = [];
		for (const foreignField in key) {
			const localField = key[foreignField];
			const alias = `alias_${foreignField}`;
			Object.assign(aliases, { [alias]: `$${foreignField}` });
			$and.push({ $eq: [`$${localField}`, `$$${alias}`] });
		}

		aggregate.push({
			$lookup: {
				from: models[modelName].collection.name,
				let: aliases,
				pipeline: [{ $match: { $expr: { $and } } }],
				as: alias,
			},
		});

		if (unwind) {
			aggregate.push({
				$unwind: { path: "$" + alias, preserveNullAndEmptyArrays: true },
			});
		}
	}
	return aggregate;
};

exports.$regex = (params) => {
	const result = {};
	_.each(_.pickBy(params, _.size), (value, key) => {
		value = value.split(" ").join(".*");
		result[key] = { $regex: value, $options: "i" };
	});
	return result;
};

exports.$in = (params) => {
	const result = {};
	_.each(_.pickBy(params, _.size), (values, key) => {
		_.isArray(values) || (values = [values]);
		result[key] = { $in: values.map(exports.objective).filter(Boolean) };
	});
	return result;
};
