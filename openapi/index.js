const constants = require("../common/constants");
const { checkConstructorProperty } = require("../common/functions");

function OpenAPIHandlerMetadata(handler, data) {
  const key = constants.OPEN_API_METADATA;
  const handlerMetadata = Reflect.getOwnMetadata(key, handler) || {};
  Object.assign(handlerMetadata, { ...data });
  Reflect.defineMetadata(key, handlerMetadata, handler);
}

class OpenAPI {
  data = {};
  constructor(initData) {
    // ...
  }

  Data(data) {
    Object.assign(this.data, { ...data });
    return this;
  }

  schemas = {};
  Schemas(schemas = {}) {
    // ...
    Object.assign(this.schemas, { ...schemas });
    return this;
  }

  // значение добавляется только целенаправленно один раз
  Summary(summary) {
    // ...
    return function (constructor, property, descriptor) {
      checkConstructor(constructor, property);
      OpenAPIHandlerMetadata(constructor[property], { summary });
      // Reflect.defineMetadata(constants.OPENAPI_SUMMARY)
    };
  }

  // значение добавляется только целенаправленно один раз
  Description(description) {
    // ...
    return function (constructor, property, descriptor) {
      checkConstructor(constructor, property);
      OpenAPIHandlerMetadata(constructor[property], { description });
      // Reflect.defineMetadata(constants.OPENAPI_SUMMARY)
    };
  }

  Parameters(properties) {
    // ...
  }

  Responses(codes) {
    // ...
  }

  RequestBody(structure) {
    // ...
  }

  // JSON generator of complete documentation
  toJSON() {
    //
  }

  // yaml generator of complete documentation
  toString() {
    // ...
  }
}
// export module
module.exports = OpenAPI;
