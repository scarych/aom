"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuerySchema = exports.QueryMap = exports.QueryParse = void 0;
const lodash_1 = require("lodash");
const fecha_1 = require("fecha");
const constants = __importStar(require("../common/constants"));
function $join(name) {
    return `$join.${name}`;
}
function valuesList(values) {
    const result = [];
    lodash_1._.flatten([values]).forEach((value) => result.push(...lodash_1._.split(value, ",")));
    return result;
}
function regex() {
    return (key, values) => {
        const safeSpace = (value) => value.split(" ").join(".*");
        return {
            [key]: { $regex: lodash_1._.map(values, safeSpace).join("|"), $options: "i" },
        };
    };
}
function $or(operand) {
    return (key, values) => {
        return { $or: lodash_1._.map(values, (value) => ({ [key]: { [operand]: value } })) };
    };
}
function $lookup({ unwind } = {}) {
    return (targetMap, keys, alias, params) => {
        const result = [];
        const modelName = keys.shift();
        const key = $join(modelName);
        if (Reflect.has(targetMap, key)) {
            const { relation, localField, foreignField } = targetMap[key];
            const aliasParams = {};
            Object.keys(params).forEach((paramKey) => {
                if (`${paramKey}`.startsWith(`${alias}.`)) {
                    const paramValue = params[paramKey];
                    const validKey = paramKey.substr(lodash_1._.size(alias) + 1);
                    Object.assign(aliasParams, { [validKey]: paramValue });
                }
            });
            if (lodash_1._.size(aliasParams) > 0) {
                const pipeline = [];
                const $match = {};
                const $expr = { $and: [] };
                const _localField = `alias_${lodash_1._.snakeCase(localField)}`;
                const $localField = `$$${_localField}`;
                const aliases = {
                    [_localField]: `$${localField}`,
                };
                $expr.$and.push({
                    $cond: {
                        if: { $isArray: $localField },
                        then: { $in: [`$${foreignField}`, $localField] },
                        else: { $eq: [`$${foreignField}`, $localField] },
                    },
                });
                Object.assign($match, { $expr });
                result.push({
                    $lookup: {
                        from: lodash_1._.snakeCase(modelName),
                        let: aliases,
                        pipeline,
                        as: alias,
                    },
                });
            }
            else {
                result.push({
                    $lookup: {
                        from: lodash_1._.snakeCase(modelName),
                        foreignField,
                        localField,
                        as: alias,
                    },
                });
            }
            if (unwind) {
                result.push({
                    $unwind: { path: `$${alias}`, preserveNullAndEmptyArrays: true },
                });
            }
        }
        return result;
    };
}
const operandsMap = {
    "": "$in",
    "!": "$nin",
    ">": $or("$gte"),
    "<": $or("$lte"),
    "~": regex(),
};
const joinMap = {
    "+": $lookup(),
    "*": $lookup({ unwind: true }),
};
function standartProcessing(key, head, rest, values, queryFieldsData) {
    const result = {};
    const { type } = queryFieldsData[key];
    if (Reflect.has(queryFieldsData, type)) {
        const subType = Reflect.getOwnMetadata(constants.MONGO_QUERY_FIELDS, type);
        head.push(key);
        key = rest.shift();
        if (Reflect.has(subType, key)) {
            return standartProcessing(key, head, rest, values, subType);
        }
        return {};
    }
    const operand = rest.shift() || "";
    if (operandsMap[operand]) {
        const operandKey = operandsMap[operand];
        const format = typeof operandKey === typeof `` ? null : operandKey;
        const safeType = (value) => {
            if (value.length) {
                try {
                    value = type(value);
                }
                catch (e) {
                    value = null;
                }
                return value;
            }
            return null;
        };
        const safeDate = (value) => (value ? (0, fecha_1.parse)(value, "isoDateTime") : null);
        let currentSafe;
        switch (type) {
            case Number:
            case String:
                currentSafe = safeType;
                break;
            case Date:
                currentSafe = safeDate;
                break;
            case Boolean:
                currentSafe = Boolean;
                break;
            default:
                console.warn("no match for type", type);
                break;
        }
        if (currentSafe) {
            const keyValue = [...head, key].join(".");
            Object.assign(result, {
                ...(format
                    ? format(keyValue, valuesList(values).map(currentSafe))
                    : {
                        [keyValue]: { [operandKey]: valuesList(values).map(currentSafe) },
                    }),
            });
        }
    }
    return result;
}
function QueryParse(constructor, query) {
    const $and = [{}];
    const $lookups = [];
    const $navigation = [];
    const $groups = [];
    const queryFieldsData = Reflect.getOwnMetadata(constants.MONGO_QUERY_FIELDS, constructor);
    Object.keys(query).forEach((fullKey) => {
        const [key, ...rest] = fullKey.split(".");
        if (Reflect.has(joinMap, key)) {
        }
        else if (Reflect.has(queryFieldsData, key)) {
            $and.push(standartProcessing(key, [], rest, query[fullKey], queryFieldsData));
        }
        else if (key === "$") {
        }
        else if (!key) {
        }
    });
    return { $and, $lookups, $navigation, $groups };
}
exports.QueryParse = QueryParse;
function QueryMap(constructor) {
    const result = [];
    const { MONGO_QUERY_FIELDS, MONGO_JOIN_FIELDS } = constants;
    if (!constructor)
        return result;
    result.push(...QueryMap(Object.getPrototypeOf(constructor)));
    const queryFieldsData = Reflect.getOwnMetadata(MONGO_QUERY_FIELDS, constructor) || {};
    Object.keys(queryFieldsData).forEach((queryField) => {
        const { type } = queryFieldsData[queryField];
        result.push({ name: queryField, type: type.name });
    });
    return result;
}
exports.QueryMap = QueryMap;
function QuerySchema(constructor) {
    const queryFields = QueryMap(constructor);
    const jsonSchema = constructor.toJSON ? Reflect.apply(constructor.toJSON, constructor, []) : {};
    const querySchemas = [
        {
            name: ".limit",
            in: "query",
            required: false,
            description: "limit data of search",
            schema: { type: "number" },
        },
        {
            name: ".offset",
            in: "query",
            required: false,
            description: "offset of search data",
            schema: { type: "number" },
        },
    ];
    queryFields.forEach((queryField) => {
        const { name, type } = queryField;
        if (Reflect.has(jsonSchema.properties, name)) {
            const schemaData = Reflect.get(jsonSchema.properties, name);
            const schema = {
                type: "array",
                items: lodash_1._.pick(schemaData, "type", "format", "enum"),
            };
            const schemaInfo = lodash_1._.pick(schemaData, "description");
            const schemaObject = {
                required: false,
                in: "query",
                ...schemaInfo,
                schema,
            };
            querySchemas.push({
                name,
                ...schemaObject,
            });
            querySchemas.push({ name: `${name}.!`, ...schemaObject });
            switch (type) {
                case String:
                    querySchemas.push({ name: `${name}.~`, ...schemaObject });
                    break;
                case Number:
                case Date:
                    querySchemas.push({ name: `${name}.>`, ...schemaObject });
                    querySchemas.push({ name: `${name}.<`, ...schemaObject });
                    break;
            }
        }
    });
    return querySchemas;
}
exports.QuerySchema = QuerySchema;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21vbmdvb3NlL2Z1bmN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQTJCO0FBQzNCLGlDQUE4QjtBQUM5QiwrREFBaUQ7QUFJakQsU0FBUyxLQUFLLENBQUMsSUFBSTtJQUNqQixPQUFPLFNBQVMsSUFBSSxFQUFFLENBQUM7QUFDekIsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLE1BQU07SUFDeEIsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBR2xCLFVBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBR0QsU0FBUyxLQUFLO0lBQ1osT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQixNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsT0FBTztZQUNMLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsVUFBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUU7U0FDckUsQ0FBQztJQUNKLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLEdBQUcsQ0FBQyxPQUFPO0lBQ2xCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFF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