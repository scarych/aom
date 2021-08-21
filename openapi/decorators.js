const constants = require("../common/constants");
const { checkConstructorProperty, checkOpenAPIMetadata } = require("../common/functions");

function mergeOpenAPIHandlerMetadata({ constructor, property = undefined }, data = {}) {
  const key = constants.OPEN_API_METADATA;
  const openapiMetadata = Reflect.getOwnMetadata(key, constructor, property) || {};
  Object.keys(data).forEach((key) => {
    if (data[key] instanceof Array) {
      const curData = openapiMetadata[key] || [];
      curData.push(...data[key]);
      openapiMetadata[key] = curData;
    } else {
      Object.assign(openapiMetadata, { [key]: data[key] });
    }
  });

  Reflect.defineMetadata(key, openapiMetadata, constructor, property);
}

function standartDecorator(data) {
  return function (constructor, property) {
    checkConstructorProperty(constructor, property);
    // Reflect.defineMetadata(constants.OPEN_API_CONTAINER_METADATA, container, constructor, property);
    mergeOpenAPIHandlerMetadata({ constructor, property }, data);
  };
}

/*
function schemasSet2json(schemasSet) {
  const result = {};

  schemasSet.forEach((constructor) => {
    const schema = targetConstructorToSchema(constructor);
    if (Object.keys(schema).length > 0) {
      const { name } = constructor;
      Object.assign(result, { [name]: schema });
    }
  });
  return result;
}
*/

/*
  schemasSet = new Set();
  AddSchema(schema) {
    this.schemasSet.add(schema);
    return this;
  }

  AddSchemas(...schemas) {
    schemas.forEach((schema) => this.AddSchema(schema));
    return this;
  }
  */

// справочник определений
const definitionsSet = new Set();
// вернуть список определений
function getDefinitions() {
  const result = {};
  definitionsSet.forEach((constructor) => {
    const { name } = constructor;
    Object.assign(result, { [name]: constructor });
  });
  return result;
}

exports.getDefinitions = getDefinitions;

function IsDefinition() {
  return (constructor) => {
    checkConstructorProperty(constructor);
    definitionsSet.add(constructor);
  };
}
exports.IsDefinition = IsDefinition;

function AddTag(tagSchema) {
  return (constructor) => {
    checkConstructorProperty(constructor);
    Reflect.defineMetadata(constants.OPENAPI_TAG, tagSchema, constructor);
  };
}
exports.AddTag = AddTag;

function AddSecurity(securitySchema) {
  return (constructor) => {
    checkConstructorProperty(constructor);
    Reflect.defineMetadata(constants.OPENAPI_SECURITY, securitySchema, constructor);
  };
}
exports.AddSecurity = AddSecurity;

// значение добавляется только целенаправленно один раз
function Summary(summary) {
  // ...
  return standartDecorator({ summary });
}
exports.Summary = Summary;

// значение добавляется только целенаправленно один раз
function Description(description) {
  // ...
  return standartDecorator({ description });
}
exports.Description = Description;

function PathParameters(pathParameters) {
  // ...
  return standartDecorator({ pathParameters });
}
exports.PathParameters = PathParameters;

function Parameters(...parameters) {
  // ...
  return standartDecorator({ parameters });
}
exports.Parameters = Parameters;

function Responses(...responses) {
  // ...
  return standartDecorator({ responses });
}

exports.Responses = Responses;

function RequestBody(requestBody) {
  // ...
  return standartDecorator({ requestBody });
}
exports.RequestBody = RequestBody;

function UseSecurity(...security) {
  // ...
  return standartDecorator({ security });
}
exports.UseSecurity = UseSecurity;

function UseTag(tag) {
  // ...
  return standartDecorator({ tag });
}
exports.UseTag = UseTag;

function ReplaceNextTags() {
  return standartDecorator({
    nextTagRule: constants.NEXT_TAGS_REPLACE,
  });
}
exports.ReplaceNextTags = ReplaceNextTags;

function IgnoreNextTags() {
  return standartDecorator({ nextTagRule: constants.NEXT_TAGS_IGNORE });
}
exports.IgnoreNextTags = IgnoreNextTags;

function MergeNextTags() {
  return standartDecorator({ nextTagRule: constants.NEXT_TAGS_MERGE });
}
exports.MergeNextTags = MergeNextTags;
