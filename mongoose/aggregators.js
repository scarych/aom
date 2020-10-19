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

exports.connector = (link, key) => {
	// compatible for most possible variations
	const unwind = !_.isArray(key);
	_.isArray(key) && (key = key.shift());
	_.isString(key) && (key = { _id: key });
	let aggregate = [];
	for (const modelName in link) {
		const alias = link[modelName];
		for (const foreignField in key) {
			const localField = key[foreignField];

			aggregate.push({
				$lookup: {
					from: models[modelName].collection.name,
					foreignField: foreignField,
					localField: localField,
					as: alias,
				},
			});
			if (unwind) {
				aggregate.push({
					$unwind: { path: "$" + alias, preserveNullAndEmptyArrays: true },
				});
			}
		}
	}
	return aggregate;
};

/*
this processing may be very slow in some undetected cases
this will be commented for the futher debug
exports.connector = (link, key) => {
	// compatible for most possible variations
	const unwind = !_.isArray(key);
	_.isArray(key) && (key = key.shift());
	_.isString(key) && (key = { _id: key });
	let aggregate = [];
	for (const modelName in link) {
		const as = link[modelName];
		const aliases = {};
		const $and = [];
		for (const foreignField in key) {
			const localField = key[foreignField];
			const alias = `alias_${_.snakeCase(localField)}`;
			Object.assign(aliases, { [alias]: `$${localField}` });
			const $alias = `$$${alias}`;
			// smart condition: if local field is array, then use `$in`, else use `$eq`
			$and.push({
				$cond: {
					if: { $isArray: $alias },
					then: { $in: [`$${foreignField}`, $alias] },
					else: { $eq: [`$${foreignField}`, $alias] },
				},
			});
		}

		aggregate.push({
			$lookup: {
				from: models[modelName].collection.name,
				let: aliases,
				pipeline: [{ $match: { $expr: { $and } } }],
				as,
			},
		});

		if (unwind) {
			aggregate.push({
				$unwind: { path: "$" + as, preserveNullAndEmptyArrays: true },
			});
		}
	}
	return aggregate;
};
*/

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
