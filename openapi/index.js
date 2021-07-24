const { validationMetadatasToSchemas } = require("class-validator-jsonschema");
const constants = require("../common/constants");
const {
  checkConstructorProperty,
  checkOpenAPIMetadata,
  restoreReverseMetadata,
} = require("../common/functions");

function OpenAPIHandlerMetadata(handler, container, data) {
  Reflect.defineMetadata(constants.OPEN_API_CONTAINER_METADATA, container, handler);
  const key = constants.OPEN_API_METADATA;
  const handlerMetadata = Reflect.getOwnMetadata(key, handler) || {};
  Object.assign(handlerMetadata, { ...data });
  Reflect.defineMetadata(key, handlerMetadata, handler);
}

function standartDecorator(container, data = {}) {
  return function (constructor, property = undefined, descriptor = undefined) {
    checkConstructorProperty(constructor, property);
    OpenAPIHandlerMetadata({ constructor, property }, container, { ...data });
  };
}
class OpenAPI {
  data = {};
  constructor(initData = {}) {
    // ...
    Object.assign(this.data, { ...initData });
  }

  paths = {};
  registerPath(route, callstack = []) {
    const { constructor, property, path, method } = route;
    const handlerOpenApiData = checkOpenAPIMetadata(constructor, property);
    if (!this.paths[path]) this.paths[path] = {};
    const currentPath = this.paths[path];
    if (!currentPath[method]) currentPath[method] = {};
    const currentMethod = currentPath[method];
    const { description, summary } = handlerOpenApiData;
    Object.assign(currentMethod, { description, summary });
    // далее следует сборка response, body и других контекстных значений,
    // которые в том числе опираются на структуры данных, которые следует дампить отдельным образом
    // миддлвари проходятся с начала и до последнего значения, и в конце обязательно должны стыковаться
    // собственные аналогичные значения
    callstack.forEach((middleware) => {
      const { constructor, property } = restoreReverseMetadata(middleware);
      const middlewareOpenApiData = checkOpenAPIMetadata(constructor, property);
      if (middlewareOpenApiData) {
        //
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
    return standartDecorator(this, { summary });
  }

  // значение добавляется только целенаправленно один раз
  Description(description) {
    // ...
    return standartDecorator(this, { description });
  }

  Parameters(parameters) {
    // ...
    return standartDecorator(this, { parameters });
  }

  Query(query) {
    // ...
    return standartDecorator(this, { query });
  }

  Responses(responses) {
    // ...
    return standartDecorator(this, { responses });
  }

  RequestBody(requestBody) {
    // ...
    return standartDecorator(this, { requestBody });
  }

  Security(security) {
    // ...
    return standartDecorator(this, { security });
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
