"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require('../common/constants');
// const { checkConstructorProperty } = require("../common/functions");

function QueryJoin(relation) {
  return (target, property) => {
    const { constructor } = target;
    // checkConstructorProperty(constructor, property);
    const { MONGO_JOIN_FIELDS } = constants;
    // -- set allowed relation by name
    /*
    console.log(
      "add relation to",
      relation,
      relation.constructor,
      relation.name,
      target.constructor,
      target.constructor.name,
      target,
      propertyKey
    );
    // */
    // создадим связь в собственной модели
    const constructorJoinMap = Reflect.defineMetadata(MONGO_JOIN_FIELDS, constructor) || new Map();
    constructorJoinMap.set(relation, {
      name: relation.name,
      localField: property,
      foreignField: "_id",
    });
    Reflect.defineMetadata(MONGO_JOIN_FIELDS, constructor, constructorJoinMap);

    // создадим реверсивную связь в целевой модели
    const relationJoinMap = Reflect.defineMetadata(MONGO_JOIN_FIELDS, relation) || new Map();
    relationJoinMap.set(constructor, {
      name: constructor.name,
      foreignField: property,
      localField: "_id",
    });
    Reflect.defineMetadata(MONGO_JOIN_FIELDS, relation, relationJoinMap);

    /*
    setWeakMap(target.constructor, {
      [$join(relation.name)]: {
        relation,
        localField: propertyKey,
        foreignField: "_id",
      },
    });

    // создадим обратную ассоциацию для будущих применений
    setWeakMap(relation, {
      [$join(target.constructor.name)]: {
        relation: target.constructor,
        foreignField: propertyKey,
        localField: "_id",
      },
    });
    */
    // console.info("related data", relation, mongoMap.get(relation));
    // появление связи в общем случае означает следующее
    //
  };
}
exports.QueryJoin = QueryJoin;

function QueryField(originType = undefined) {
  return (target, property) => {
    const { constructor } = target;
    // checkConstructorProperty(constructor, property);
    const { MONGO_QUERY_FIELDS } = constants;
    const queryFieldsData = Reflect.getOwnMetadata(MONGO_QUERY_FIELDS, constructor) || {};
    const designTypeMetakey = "design:type";
    const type = originType || Reflect.getOwnMetadata(designTypeMetakey, constructor, property);
    if (type) {
      Object.assign(queryFieldsData, { [property]: { type } });
    } else {
      throw new Error(constants.MONGO_QUERY_FIELDS_TYPE_ERROR);
    }
    Reflect.defineMetadata(MONGO_QUERY_FIELDS, queryFieldsData, constructor);
  };
}

exports.QueryField = QueryField;

// module.exports = { query, join, data };
