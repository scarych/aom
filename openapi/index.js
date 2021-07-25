const { targetConstructorToSchema } = require("class-validator-jsonschema");
const constants = require("../common/constants");
const { checkConstructorProperty, checkOpenAPIMetadata } = require("../common/functions");

function OpenAPIHandlerMetadata({ constructor, property = undefined }, container, data) {
  Reflect.defineMetadata(constants.OPEN_API_CONTAINER_METADATA, container, constructor, property);
  const key = constants.OPEN_API_METADATA;
  const openapiMetadata = Reflect.getOwnMetadata(key, constructor, property) || {};
  Object.assign(openapiMetadata, { ...data });
  Reflect.defineMetadata(key, openapiMetadata, constructor, property);
}

function standartDecorator(container, data = {}) {
  return function (constructor, property = undefined, descriptor = undefined) {
    checkConstructorProperty(constructor, property);
    OpenAPIHandlerMetadata({ constructor, property }, container, { ...data });
  };
}

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
class OpenAPI {
  data = {
    openapi: "3.0.0",
  };
  constructor(initData = {}) {
    // ...
    Object.assign(this.data, { ...initData });
  }

  paths = {};
  registerPath(route, middlewares = []) {
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
    middlewares.forEach((middleware) => {
      const { constructor, property, handler } = middleware;
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

  schemasSet = new Set();
  AddSchema(schema) {
    this.schemasSet.add(schema);
    return this;
  }

  AddSchemas(schemas = []) {
    schemas.forEach(this.AddSchema);
    return this;
  }

  tagsSet = new Set();
  AddTag(tag = {}) {
    this.tagsSet.add(tag);
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

  Tags(tags) {
    // ...
    return standartDecorator(this, { tags });
  }

  // JSON generator of complete documentation
  toJSON() {
    //
    return Object.assign(
      {},
      {
        ...this.data,
        components: {
          schemas: schemasSet2json(this.schemasSet),
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
