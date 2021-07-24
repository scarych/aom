const { validationMetadatasToSchemas } = require("class-validator-jsonschema");
const constants = require("../common/constants");
const { checkConstructorProperty, checkOpenAPIMetadata } = require("../common/functions");

function OpenAPIHandlerMetadata(handler, container, data) {
  Reflect.defineMetadata(constants.OPEN_API_CONTAINTER_METADATA, container, handler);
  const key = constants.OPEN_API_METADATA;
  const handlerMetadata = Reflect.getOwnMetadata(key, handler) || {};
  Object.assign(handlerMetadata, { ...data });
  Reflect.defineMetadata(key, handlerMetadata, handler);
}

class OpenAPI {
  data = {};
  constructor(initData = {}) {
    // ...
    Object.assign(this.data, { ...initData });
  }

  paths = {};
  registerPath(route, callstack = []) {
    const { handler, path, method } = route;
    const handlerOpenApiData = checkOpenAPIMetadata(handler);
    if (!this.paths[path]) this.paths[path] = {};
    const currentPath = this.paths[path];
    if (!currentPath[method]) currentPath[method] = {};
    const currentMethod = currentPath[method];
    const { description, summary } = handlerOpenApiData;
    Object.assign(currentMethod, { description, summary });
    // далее следует сборка response, body и других контекстных значений,
    // которые в том числе опираются на структуры данных, которые следует дампить отдельным образом
    callstack.forEach((middleware) => {
      const middlewareOpenApiData = checkOpenAPIMetadata(middleware);
      if (middlewareOpenApiData) {
      }
    });
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
      checkConstructorProperty(constructor, property);
      OpenAPIHandlerMetadata(constructor[property], this, { summary });
      // Reflect.defineMetadata(constants.OPENAPI_SUMMARY)
    };
  }

  // значение добавляется только целенаправленно один раз
  Description(description) {
    // ...
    return function (constructor, property, descriptor) {
      checkConstructorProperty(constructor, property);
      OpenAPIHandlerMetadata(constructor[property], this, { description });
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
    return Object.assign(
      {},
      {
        ...this.data,
        components: {
          schemas: validationMetadatasToSchemas(),
        },
        paths: this.paths,
      }
    );
  }

  // yaml generator of complete documentation
  toString() {
    // ...
  }
}
// export module
module.exports = OpenAPI;
