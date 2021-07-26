const { targetConstructorToSchema } = require("class-validator-jsonschema");
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

function standartDecorator(container, data) {
  return function (constructor, property = undefined, descriptor = undefined) {
    checkConstructorProperty(constructor, property);
    Reflect.defineMetadata(constants.OPEN_API_CONTAINER_METADATA, container, constructor, property);
    mergeOpenAPIHandlerMetadata({ constructor, property }, data);
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
    let { constructor, property, path, method } = route;
    const handlerOpenApiData = checkOpenAPIMetadata(constructor, property);
    const currentMethod = {};

    const { description, summary, tags = [] } = handlerOpenApiData;
    Object.assign(currentMethod, { description, summary });
    // далее следует сборка response, body и других контекстных значений,
    // которые в том числе опираются на структуры данных, которые следует дампить отдельным образом
    // миддлвари проходятся с начала и до последнего значения, и в конце обязательно должны стыковаться
    // собственные аналогичные значения
    middlewares.forEach((middleware) => {
      const { constructor, property, handler } = middleware;
      const middlewareOpenApiData = checkOpenAPIMetadata(constructor, property);
      if (middlewareOpenApiData) {
        if (middlewareOpenApiData.tags) {
          tags.push(...middlewareOpenApiData.tags);
        }

        //
        if (middlewareOpenApiData.parameters) {
          const { parameters } = middlewareOpenApiData;
          if (!currentMethod.parameters) currentMethod.parameters = [];
          const currentParameters = currentMethod.parameters;
          Object.keys(parameters).forEach((parameter) => {
            const parameterProps = parameters[parameter];
            const { name } = parameterProps;
            // здесь происходит замена полного написания параметра на его openApi валидную нотацию
            path = path.replace(parameter, `{${name}}`);
            currentParameters.push({
              ...parameterProps,
              in: "path",
              required: true,
            });
          });
        }
      }
    });

    // добавим только те теги, которые есть в общем хранилище
    if (tags.length) {
      Object.assign(currentMethod, {
        tags: tags
          .filter((tagKey) => this.tagsSet.has(tagKey))
          .map((tagKey) => this.tagsMap.get(tagKey)),
      });
    }
    // в конце добавим путь и метод в общий список
    if (!this.paths[path]) this.paths[path] = {};
    this.paths[path][method] = currentMethod;
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

  AddSchemas(...schemas) {
    schemas.forEach((schema) => this.AddSchema(schema));
    return this;
  }

  tagsSet = new Set();
  tagsMap = new Map();
  AddTags(tags = {}) {
    Object.keys(tags).forEach((tagKey) => {
      this.tagsSet.add(tagKey);
      this.tagsMap.set(tagKey, tags[tagKey]);
    });
    return this;
  }

  // базовая информация: summary, description, tags
  Info(info = {}) {
    // ...
    return standartDecorator(this, { ...info });
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

  Tags(...tags) {
    // ...
    return standartDecorator(this, { tags });
  }

  // JSON generator of complete documentation
  toJSON() {
    const tags = {};
    this.tagsSet.forEach((tagName) => tags.push(this.tagsMap.get(tagName)));
    //
    return Object.assign(
      {},
      {
        ...this.data,
        components: {
          schemas: schemasSet2json(this.schemasSet),
          tags,
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
