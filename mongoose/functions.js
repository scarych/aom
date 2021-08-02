"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { ObjectId } = require("mongodb");
const _ = require("lodash");
const moment = require("moment");
const constants = require("../common/constants");

// const mongoMap = new WeakMap(); // далее следует собрать карту ассоциаций

function $join(name) {
  return `$join.${name}`;
}

function valuesList(values, type) {
  const result = [];
  // const sameValue = (value) => value;

  _.flatten([values]).forEach((value) => result.push(..._.split(value, ",")));
  return result;
}

// быстрый паттерн регулярного выражения
function regex() {
  return (key, values) => {
    const safeSpace = (value) => value.split(" ").join(".*");
    return {
      [key]: { $regex: _.map(values, safeSpace).join("|"), $options: "i" },
    };
  };
}

function $or(operand) {
  return (key, values) => {
    return { $or: _.map(values, (value) => ({ [key]: { [operand]: value } })) };
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
          const validKey = paramKey.substr(_.size(alias) + 1);
          Object.assign(aliasParams, { [validKey]: paramValue });
        }
      });
      // если количество аргументов не пусто - то делаем сложный lookup с условиями
      // для этого используем функцию из mongoose
      if (_.size(aliasParams) > 0) {
        // console.log("do connection", { aliasParams, relation });
        // по идее здесь следует вызывать relation.$where, который сформирует на основании
        // входящих данных корректный запрос, который можно использовать в требуемом контексте
        // return relation.data();
        const pipeline = [];
        const $match = {};
        const $expr = { $and: [] };
        // const foreignField = "_id";
        // сформируем критерий, по которому сопоставляем значения ключей: напрямую или поиск в списке
        const _localField = `alias_${_.snakeCase(localField)}`;
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
        const parseResult = parse(relation, aliasParams);
        // обогатим условия отбора значений
        Object.assign($match, { $and: parseResult.$and });
        // обогатим pipeline
        pipeline.push({ $match });
        // добавим lookup-ы, если есть в контексте
        pipeline.push(...parseResult.$lookups);

        result.push({
          $lookup: {
            from: _.snakeCase(modelName),
            let: aliases,
            pipeline,
            as: alias,
          },
        });
      } else {
        result.push({
          $lookup: {
            from: _.snakeCase(modelName),
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
        } catch (e) {
          value = null;
        }
        return value;
      }
      return null;
    };
    const safeDate = (value) => (value ? moment(value).toDate() : null);
    let currentSafe;
    // console.log("current type", type, format, operandKey, values);
    switch (type) {
      case Number:
      case String:
      case ObjectId:
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
    } else if (Reflect.has(queryFieldsData, key)) {
      // если есть совпадение по аттрибуту, то обогатим значение $and
      $and.push(standartProcessing(key, [], rest, query[fullKey], queryFieldsData));
    } else if (key === "$") {
      // если быстрая группировка
    } else if (!key) {
      // если пустой ключ (то есть сортировка, навигация)
    }
  });
  return { $and, $lookups, $navigation, $groups };
}

exports.QueryParse = QueryParse;

// возвращает список возможных полей и масок, которые могут быть применены
function QueryMap(constructor) {
  const { MONGO_QUERY_FIELDS, MONGO_JOIN_FIELDS } = constants;
  const queryFieldsData = Reflect.getOwnMetadata(MONGO_QUERY_FIELDS, constructor) || {};
  const result = [];
  Object.keys(queryFieldsData).forEach((queryField) => {
    const { type } = queryFieldsData[queryField];
    result.push({ name: queryField, type: type.name });
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
  });
  // look for exists join data
  const joinFieldsData = Reflect.getOwnMetadata(MONGO_JOIN_FIELDS, constructor) || new Map();
  joinFieldsData.forEach((value, key) => {
    console.log({ value, key });
    const { name } = value;
    result.push({ name: `+.${name}`, type: String.name });
    result.push({ name: `*.${name}`, type: String.name });
  });
  result.push({ name: ".offset", type: Number.name });
  result.push({ name: ".limit", type: Number.name });
  return result;
}

exports.QueryMap = QueryMap;
