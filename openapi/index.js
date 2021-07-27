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
  mergeSeparator = "+";
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

    // если стоит собственный тег на ендпоинте, то он прироритетнее всего
    const { description, summary, responses = [], tag } = handlerOpenApiData;
    Object.assign(currentMethod, { description, summary });
    // далее следует сборка response, body и других контекстных значений,
    // которые в том числе опираются на структуры данных, которые следует дампить отдельным образом
    // миддлвари проходятся с начала и до последнего значения, и в конце обязательно должны стыковаться
    // собственные аналогичные значения
    // let lastTag; // последний найденный тег, который будет, если нет собственного
    let branchTags = []; // теги для слияния в потоке
    let nextTagRule = constants.NEXT_TAGS_REPLACE; // правило сборки тегов, по умолчанию - замена
    middlewares.forEach((middleware) => {
      const { constructor, property, handler } = middleware;
      const middlewareOpenApiData = checkOpenAPIMetadata(constructor, property);
      if (middlewareOpenApiData) {
        // если в потоке стоит правило замены тегов, то
        if (middlewareOpenApiData.nextTagRule) {
          nextTagRule = middlewareOpenApiData.nextTagRule;
        }
        // дальнейшие действия выполняются, если нет инструкции игнорировать следующие теги
        if (middlewareOpenApiData.tag && nextTagRule !== constants.NEXT_TAGS_IGNORE) {
          // если стоит инструкция замены тегов
          if (nextTagRule === constants.NEXT_TAGS_REPLACE) {
            branchTags = [middlewareOpenApiData.tag];
            // tags.push(...middlewareOpenApiData.tags);
          } else if (nextTagRule === constants.NEXT_TAGS_MERGE) {
            branchTags.push(middlewareOpenApiData.tag);
          }
        }

        // build responses in branch
        if (middlewareOpenApiData.responses) {
          responses.push(...middlewareOpenApiData.responses);
        }

        // build parameters in branch
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
    if (tag || branchTags.length) {
      Object.assign(currentMethod, {
        tags: this.mergeAndExtractTags(tag ? [tag] : branchTags),
      });
    }
    if (responses.length) {
      Object.assign(currentMethod, {
        responses: this.buildResponses(responses),
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

  Responses(...responses) {
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

  Tag(tag) {
    // ...
    return standartDecorator(this, { tag });
  }

  ReplaceNextTags() {
    return standartDecorator(this, {
      nextTagRule: constants.NEXT_TAGS_REPLACE,
    });
  }

  IgnoreNextTags() {
    return standartDecorator(this, { nextTagRule: constants.NEXT_TAGS_IGNORE });
  }

  MergeNextTags() {
    return standartDecorator(this, { nextTagRule: constants.NEXT_TAGS_MERGE });
  }

  // склеить и вернуть валидный список тегов по ключам
  mergeAndExtractTags(tagsKeys = []) {
    const { mergeSeparator } = this;
    const validTags = tagsKeys.filter((tagKey) => this.tagsSet.has(tagKey));
    const validTagsName = validTags.map((tagKey) => Reflect.get(this.tagsMap.get(tagKey), "name"));
    // если в списке больше чем один тег, то производим хитрую операцию слияния
    if (validTags.length > 1) {
      const resultTagCode = validTags.join(mergeSeparator);
      const resultTagName = validTagsName.join(mergeSeparator);
      this.AddTags({
        [`${resultTagCode}`]: { name: resultTagName },
      });
      return [resultTagName];
    } else {
      // иначе возвращаем то, что получилось (1 тег или пустой массив)
      return validTagsName;
    }
  }

  buildResponses(responses) {
    const result = {};
    responses.forEach((responseData) => {
      const { status, schema, description } = responseData;
      const { contentType = "application/json" } = responseData;
      const contentSchema = {};
      if (this.schemasSet.has(schema)) {
        const { name } = schema;
        Object.assign(contentSchema, {
          schema: { $ref: `#/components/schemas/${name}` },
        });
      } else {
        Object.assign(contentSchema, { ...schema });
      }
      const content = { [contentType]: contentSchema };
      result[status] = { description, content };
    });

    return result;
    // return undefined;
  }

  // JSON generator of complete documentation
  toJSON() {
    const tags = [];
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
