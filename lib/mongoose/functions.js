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
// const mongoMap = new WeakMap(); // далее следует собрать карту ассоциаций
function $join(name) {
    return `$join.${name}`;
}
function valuesList(values) {
    const result = [];
    // const sameValue = (value) => value;
    lodash_1._.flatten([values]).forEach((value) => result.push(...lodash_1._.split(value, ",")));
    return result;
}
// быстрый паттерн регулярного выражения
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
        // console.log("do join with", { targetMap, key, modelName });
        if (Reflect.has(targetMap, key)) {
            // итак, на данном месте есть следующая информация
            // relation - класс, из которого будет извлечена информация
            // modelName - название модели, которое можно превратить в snakeCase
            // alias - имя, по которому будет происходить соединение
            // operand - означающий, делать unwind или нет
            // params - из которых можно извлечь условия, относящиеся к этому документу
            // и как минимум применить их, чтобы извлечь из модели данные
            // в зависимости от того, будут ли вообще ограничители, строится тот или иной тип lookup-а
            // быстрый или медленный
            const { relation, localField, foreignField } = targetMap[key];
            // по идее на основании всех этих данных можно составить запрос
            // для начала, отберем те условия, которые характеризуют данную связь
            const aliasParams = {};
            Object.keys(params).forEach((paramKey) => {
                if (`${paramKey}`.startsWith(`${alias}.`)) {
                    const paramValue = params[paramKey];
                    const validKey = paramKey.substr(lodash_1._.size(alias) + 1);
                    Object.assign(aliasParams, { [validKey]: paramValue });
                }
            });
            // если количество аргументов не пусто - то делаем сложный lookup с условиями
            // для этого используем функцию из mongoose
            if (lodash_1._.size(aliasParams) > 0) {
                // console.log("do connection", { aliasParams, relation });
                // по идее здесь следует вызывать relation.$where, который сформирует на основании
                // входящих данных корректный запрос, который можно использовать в требуемом контексте
                // return relation.data();
                const pipeline = [];
                const $match = {};
                const $expr = { $and: [] };
                // const foreignField = "_id";
                // сформируем критерий, по которому сопоставляем значения ключей: напрямую или поиск в списке
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
                // почему-то тут выдает ошибку объявления переменной, при оптимизации - исправить
                // eslint-disable-next-line no-use-before-define
                /*
                потом посмотреть, что здесь было не так
                const parseResult = parse(relation, aliasParams);
                // обогатим условия отбора значений
                Object.assign($match, { $and: parseResult.$and });
                // обогатим pipeline
                pipeline.push({ $match });
                // добавим lookup-ы, если есть в контексте
                pipeline.push(...parseResult.$lookups);
                */
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
            // если требуется, добавим unwind
            if (unwind) {
                result.push({
                    $unwind: { path: `$${alias}`, preserveNullAndEmptyArrays: true },
                });
            }
        }
        // вернем списки с данными
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
    // если для указанного типа есть ассоциативная запись
    // то считаем это поиском во вложенных структурах
    if (Reflect.has(queryFieldsData, type)) {
        // const subType = mongoMap.get(type);
        const subType = Reflect.getOwnMetadata(constants.MONGO_QUERY_FIELDS, type);
        head.push(key);
        key = rest.shift();
        // если ключ поддерживается мета-аттрибутикой, то рекурсивно погрузимся в обработку
        if (Reflect.has(subType, key)) {
            return standartProcessing(key, head, rest, values, subType);
        }
        // иначе пропустим обработку, вернем пустое значение
        return {};
    }
    const operand = rest.shift() || "";
    if (operandsMap[operand]) {
        const operandKey = operandsMap[operand];
        const format = typeof operandKey === typeof `` ? null : operandKey;
        // безопасное приведение типов, возвращет null
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
        // console.log("current type", type, format, operandKey, values);
        switch (type) {
            case Number:
            case String:
                // case ObjectId:
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
    // const targetMap = mongoMap.get(constructor) || {};
    const queryFieldsData = Reflect.getOwnMetadata(constants.MONGO_QUERY_FIELDS, constructor);
    Object.keys(query).forEach((fullKey) => {
        const [key, ...rest] = fullKey.split(".");
        // если по ключу удалось найти правило для объединений
        // то добавим стандартный обработчик
        if (Reflect.has(joinMap, key)) {
            /*
            $lookups.push(
              ...Reflect.apply(joinMap[key], undefined, [queryFieldsData, rest, query[fullKey], query])
            );
            */
        }
        else if (Reflect.has(queryFieldsData, key)) {
            // если есть совпадение по аттрибуту, то обогатим значение $and
            $and.push(standartProcessing(key, [], rest, query[fullKey], queryFieldsData));
        }
        else if (key === "$") {
            // если быстрая группировка
        }
        else if (!key) {
            // если пустой ключ (то есть сортировка, навигация)
        }
    });
    return { $and, $lookups, $navigation, $groups };
}
exports.QueryParse = QueryParse;
// возвращает список возможных полей и масок, которые могут быть применены
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
        /*
        result.push({ name: `${queryField}.!`, type: type.name });
        switch (type) {
          case String:
            result.push({ name: `${queryField}.~`, type: type.name });
          case Number:
          case Date:
            result.push({ name: `${queryField}.>`, type: type.name });
            result.push({ name: `${queryField}.<`, type: type.name });
            break;
        }
        */
    });
    // look for exists join data
    /*
    const joinFieldsData = Reflect.getOwnMetadata(MONGO_JOIN_FIELDS, constructor) || new Map();
    joinFieldsData.forEach((value, key) => {
      console.log({ value, key });
      const { name } = value;
      result.push({ name: `+.${name}`, type: String.name });
      result.push({ name: `*.${name}`, type: String.name });
    });
    result.push({ name: ".offset", type: Number.name });
    result.push({ name: ".limit", type: Number.name });
    */
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
            // ..
            const schemaData = Reflect.get(jsonSchema.properties, name);
            // /*
            const schema = {
                type: "array",
                items: lodash_1._.pick(schemaData, "type", "format", "enum"),
            };
            // */
            /*
            const schema = {
              ..._.pick(schemaData, "type", "format", "enum"),
            };
            */
            const schemaInfo = lodash_1._.pick(schemaData, "description"
            // "example",
            // "examples"
            );
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21vbmdvb3NlL2Z1bmN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsbUNBQTJCO0FBQzNCLGlDQUE4QjtBQUM5QiwrREFBaUQ7QUFFakQsNEVBQTRFO0FBRTVFLFNBQVMsS0FBSyxDQUFDLElBQUk7SUFDakIsT0FBTyxTQUFTLElBQUksRUFBRSxDQUFDO0FBQ3pCLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxNQUFNO0lBQ3hCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNsQixzQ0FBc0M7SUFFdEMsVUFBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVFLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCx3Q0FBd0M7QUFDeEMsU0FBUyxLQUFLO0lBQ1osT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQixNQUFNLFNBQVMsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsT0FBTztZQUNMLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsVUFBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUU7U0FDckUsQ0FBQztJQUNKLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFTLEdBQUcsQ0FBQyxPQUFPO0lBQ2xCLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckIsT0FBTyxFQUFFLEdBQUcsRUFBRSxVQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDOUUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsT0FBTyxDQUFDLEVBQUUsTUFBTSxLQUFVLEVBQUU7SUFDbkMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3hDLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNsQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDL0IsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdCLDhEQUE4RDtRQUM5RCxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQy9CLGtEQUFrRDtZQUNsRCwyREFBMkQ7WUFDM0Qsb0VBQW9FO1lBQ3BFLHdEQUF3RDtZQUN4RCw4Q0FBOEM7WUFDOUMsMkVBQTJFO1lBQzNFLDZEQUE2RDtZQUM3RCwwRkFBMEY7WUFDMUYsd0JBQXdCO1lBQ3hCLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM5RCwrREFBK0Q7WUFDL0QscUVBQXFFO1lBQ3JFLE1BQU0sV0FBVyxHQUFHLEVBQUUsQ0FBQztZQUN2QixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUN2QyxJQUFJLEdBQUcsUUFBUSxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsRUFBRTtvQkFDekMsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUNwQyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7b0JBQ3BELE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO2lCQUN4RDtZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsNkVBQTZFO1lBQzdFLDJDQUEyQztZQUMzQyxJQUFJLFVBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUMzQiwyREFBMkQ7Z0JBQzNELGtGQUFrRjtnQkFDbEYsc0ZBQXNGO2dCQUN0RiwwQkFBMEI7Z0JBQzFCLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztnQkFDcEIsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDO2dCQUNsQixNQUFNLEtBQUssR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDM0IsOEJBQThCO2dCQUM5Qiw2RkFBNkY7Z0JBQzdGLE1BQU0sV0FBVyxHQUFHLFNBQVMsVUFBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxNQUFNLFdBQVcsR0FBRyxLQUFLLFdBQVcsRUFBRSxDQUFDO2dCQUN2QyxNQUFNLE9BQU8sR0FBRztvQkFDZCxDQUFDLFdBQVcsQ0FBQyxFQUFFLElBQUksVUFBVSxFQUFFO2lCQUNoQyxDQUFDO2dCQUNGLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO29CQUNkLEtBQUssRUFBRTt3QkFDTCxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFO3dCQUM3QixJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLFlBQVksRUFBRSxFQUFFLFdBQVcsQ0FBQyxFQUFFO3dCQUNoRCxJQUFJLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLFlBQVksRUFBRSxFQUFFLFdBQVcsQ0FBQyxFQUFFO3FCQUNqRDtpQkFDRixDQUFDLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVqQyxpRkFBaUY7Z0JBQ2pGLGdEQUFnRDtnQkFDaEQ7Ozs7Ozs7OztrQkFTRTtnQkFFRixNQUFNLENBQUMsSUFBSSxDQUFDO29CQUNWLE9BQU8sRUFBRTt3QkFDUCxJQUFJLEVBQUUsVUFBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7d0JBQzVCLEdBQUcsRUFBRSxPQUFPO3dCQUNaLFFBQVE7d0JBQ1IsRUFBRSxFQUFFLEtBQUs7cUJBQ1Y7aUJBQ0YsQ0FBQyxDQUFDO2FBQ0o7aUJBQU07Z0JBQ0wsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDVixPQUFPLEVBQUU7d0JBQ1AsSUFBSSxFQUFFLFVBQUMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDO3dCQUM1QixZQUFZO3dCQUNaLFVBQVU7d0JBQ1YsRUFBRSxFQUFFLEtBQUs7cUJBQ1Y7aUJBQ0YsQ0FBQyxDQUFDO2FBQ0o7WUFFRCxpQ0FBaUM7WUFDakMsSUFBSSxNQUFNLEVBQUU7Z0JBQ1YsTUFBTSxDQUFDLElBQUksQ0FBQztvQkFDVixPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxLQUFLLEVBQUUsRUFBRSwwQkFBMEIsRUFBRSxJQUFJLEVBQUU7aUJBQ2pFLENBQUMsQ0FBQzthQUNKO1NBQ0Y7UUFDRCwwQkFBMEI7UUFDMUIsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sV0FBVyxHQUFHO0lBQ2xCLEVBQUUsRUFBRSxLQUFLO0lBQ1QsR0FBRyxFQUFFLE1BQU07SUFDWCxHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUNoQixHQUFHLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQztJQUNoQixHQUFHLEVBQUUsS0FBSyxFQUFFO0NBQ2IsQ0FBQztBQUVGLE1BQU0sT0FBTyxHQUFHO0lBQ2QsR0FBRyxFQUFFLE9BQU8sRUFBRTtJQUNkLEdBQUcsRUFBRSxPQUFPLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUM7Q0FDL0IsQ0FBQztBQUVGLFNBQVMsa0JBQWtCLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLGVBQWU7SUFDbEUsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdEMscURBQXFEO0lBQ3JELGlEQUFpRDtJQUNqRCxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxFQUFFO1FBQ3RDLHNDQUFzQztRQUN0QyxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNuQixtRkFBbUY7UUFDbkYsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRTtZQUM3QixPQUFPLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM3RDtRQUNELG9EQUFvRDtRQUNwRCxPQUFPLEVBQUUsQ0FBQztLQUNYO0lBQ0QsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNuQyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUN4QixNQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEMsTUFBTSxNQUFNLEdBQUcsT0FBTyxVQUFVLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDO1FBRW5FLDhDQUE4QztRQUM5QyxNQUFNLFFBQVEsR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3pCLElBQUksS0FBSyxDQUFDLE1BQU0sRUFBRTtnQkFDaEIsSUFBSTtvQkFDRixLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNyQjtnQkFBQyxPQUFPLENBQUMsRUFBRTtvQkFDVixLQUFLLEdBQUcsSUFBSSxDQUFDO2lCQUNkO2dCQUNELE9BQU8sS0FBSyxDQUFDO2FBQ2Q7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUMsQ0FBQztRQUNGLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBQSxhQUFLLEVBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6RSxJQUFJLFdBQVcsQ0FBQztRQUNoQixpRUFBaUU7UUFDakUsUUFBUSxJQUFJLEVBQUU7WUFDWixLQUFLLE1BQU0sQ0FBQztZQUNaLEtBQUssTUFBTTtnQkFDVCxpQkFBaUI7Z0JBQ2pCLFdBQVcsR0FBRyxRQUFRLENBQUM7Z0JBQ3ZCLE1BQU07WUFDUixLQUFLLElBQUk7Z0JBQ1AsV0FBVyxHQUFHLFFBQVEsQ0FBQztnQkFDdkIsTUFBTTtZQUNSLEtBQUssT0FBTztnQkFDVixXQUFXLEdBQUcsT0FBTyxDQUFDO2dCQUN0QixNQUFNO1lBQ1I7Z0JBQ0UsT0FBTyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDeEMsTUFBTTtTQUNUO1FBQ0QsSUFBSSxXQUFXLEVBQUU7WUFDZixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQUcsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtnQkFDcEIsR0FBRyxDQUFDLE1BQU07b0JBQ1IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDdkQsQ0FBQyxDQUFDO3dCQUNFLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUU7cUJBQ2xFLENBQUM7YUFDUCxDQUFDLENBQUM7U0FDSjtLQUNGO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELFNBQWdCLFVBQVUsQ0FBQyxXQUFXLEVBQUUsS0FBSztJQUMzQyxNQUFNLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2xCLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNwQixNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFDdkIsTUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ25CLHFEQUFxRDtJQUNyRCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUMxRixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1FBQ3JDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLHNEQUFzRDtRQUN0RCxvQ0FBb0M7UUFDcEMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsRUFBRTtZQUM3Qjs7OztjQUlFO1NBQ0g7YUFBTSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQzVDLCtEQUErRDtZQUMvRCxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1NBQy9FO2FBQU0sSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFO1lBQ3RCLDJCQUEyQjtTQUM1QjthQUFNLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDZixtREFBbUQ7U0FDcEQ7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUNsRCxDQUFDO0FBM0JELGdDQTJCQztBQUVELDBFQUEwRTtBQUMxRSxTQUFnQixRQUFRLENBQUMsV0FBVztJQUNsQyxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbEIsTUFBTSxFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLEdBQUcsU0FBUyxDQUFDO0lBRTVELElBQUksQ0FBQyxXQUFXO1FBQUUsT0FBTyxNQUFNLENBQUM7SUFFaEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU3RCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0RixNQUFNLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO1FBQ2xELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0MsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ25EOzs7Ozs7Ozs7OztVQVdFO0lBQ0osQ0FBQyxDQUFDLENBQUM7SUFDSCw0QkFBNEI7SUFDNUI7Ozs7Ozs7Ozs7TUFVRTtJQUNGLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUF0Q0QsNEJBc0NDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLFdBQVc7SUFDckMsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxXQUFXLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUNoRyxNQUFNLFlBQVksR0FBRztRQUNuQjtZQUNFLElBQUksRUFBRSxRQUFRO1lBQ2QsRUFBRSxFQUFFLE9BQU87WUFDWCxRQUFRLEVBQUUsS0FBSztZQUNmLFdBQVcsRUFBRSxzQkFBc0I7WUFDbkMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtTQUMzQjtRQUNEO1lBQ0UsSUFBSSxFQUFFLFNBQVM7WUFDZixFQUFFLEVBQUUsT0FBTztZQUNYLFFBQVEsRUFBRSxLQUFLO1lBQ2YsV0FBVyxFQUFFLHVCQUF1QjtZQUNwQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO1NBQzNCO0tBQ0YsQ0FBQztJQUNGLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTtRQUNqQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLFVBQVUsQ0FBQztRQUNsQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsRUFBRTtZQUM1QyxLQUFLO1lBQ0wsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQzVELEtBQUs7WUFDTCxNQUFNLE1BQU0sR0FBRztnQkFDYixJQUFJLEVBQUUsT0FBTztnQkFDYixLQUFLLEVBQUUsVUFBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUM7YUFDcEQsQ0FBQztZQUNGLEtBQUs7WUFDTDs7OztjQUlFO1lBQ0YsTUFBTSxVQUFVLEdBQUcsVUFBQyxDQUFDLElBQUksQ0FDdkIsVUFBVSxFQUNWLGFBQWE7WUFDYixhQUFhO1lBQ2IsYUFBYTthQUNkLENBQUM7WUFDRixNQUFNLFlBQVksR0FBRztnQkFDbkIsUUFBUSxFQUFFLEtBQUs7Z0JBQ2YsRUFBRSxFQUFFLE9BQU87Z0JBQ1gsR0FBRyxVQUFVO2dCQUNiLE1BQU07YUFDUCxDQUFDO1lBQ0YsWUFBWSxDQUFDLElBQUksQ0FBQztnQkFDaEIsSUFBSTtnQkFDSixHQUFHLFlBQVk7YUFDaEIsQ0FBQyxDQUFDO1lBRUgsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxFQUFFLEdBQUcsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUMxRCxRQUFRLElBQUksRUFBRTtnQkFDWixLQUFLLE1BQU07b0JBQ1QsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxFQUFFLEdBQUcsWUFBWSxFQUFFLENBQUMsQ0FBQztvQkFDMUQsTUFBTTtnQkFDUixLQUFLLE1BQU0sQ0FBQztnQkFDWixLQUFLLElBQUk7b0JBQ1AsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxFQUFFLEdBQUcsWUFBWSxFQUFFLENBQUMsQ0FBQztvQkFDMUQsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksSUFBSSxFQUFFLEdBQUcsWUFBWSxFQUFFLENBQUMsQ0FBQztvQkFDMUQsTUFBTTthQUNUO1NBQ0Y7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFsRUQsa0NBa0VDIn0=