("use strict");
Object.defineProperty(exports, "__esModule", { value: true });
const tslib = require("tslib");
tslib.__exportStar(require("./decorators"), exports);

const constants = require("../common/constants");
const { checkOpenAPIMetadata } = require("../common/functions");

class OpenApi {
  mergeSeparator = "+";
  data = {
    openapi: "3.0.0",
  };
  constructor(initData = {}) {
    // ...
    Object.assign(this.data, { ...initData });
  }

  tagsSet = new Set();
  tagsMap = new Map();

  securitySet = new Set();
  securityMap = new Map();

  paths = {};
  registerPath(route) {
    let { constructor, property, path, method, middlewares } = route;
    const handlerOpenApiData = checkOpenAPIMetadata(constructor, property);
    if (!handlerOpenApiData) return;
    // console.log(handlerOpenApiData);
    const currentMethod = {};

    // если стоит собственный тег на ендпоинте, то он прироритетнее всего
    const {
      description,
      summary,
      responses = [],
      requestBody,
      tag,
      security = [],
      parameters = [],
    } = handlerOpenApiData;
    // инициируем базовую информацию о текущем методе
    Object.assign(currentMethod, {
      description,
      summary,
      parameters,
    });
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

        // if middleware has security rule
        if (middlewareOpenApiData.security instanceof Array) {
          security.push(...middlewareOpenApiData.security);
        }

        // build responses in branch
        if (middlewareOpenApiData.responses instanceof Array) {
          responses.push(...middlewareOpenApiData.responses);
        }

        // build path parameters in branch
        if (middlewareOpenApiData.pathParameters) {
          const { pathParameters } = middlewareOpenApiData;

          const currentParameters = currentMethod.parameters;
          Object.keys(pathParameters).forEach((parameterKey) => {
            const parameterProps = pathParameters[parameterKey];
            const { name } = parameterProps;
            // здесь происходит замена полного написания параметра на его openApi валидную нотацию
            path = path.replace(parameterKey, `{${name}}`);
            // добавим в список параметров новые значения, добавив значения по умолчанию
            // но не ограничив их наличие в других местах
            // (например та же query_string, выраженная в виде обязательного параметра)
            currentParameters.push({
              in: "path",
              required: true,
              ...parameterProps,
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

    // add security rules
    if (security.length) {
      Object.assign(currentMethod, {
        security: security
          .filter((securityContainer) =>
            Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, securityContainer)
          )
          .map((securityContainer) => {
            // внесем в справочник данные о протоколах безопасности
            if (!this.securitySet.has(securityContainer)) {
              this.securitySet.add(securityContainer);
              this.securityMap.set(
                securityContainer,
                Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, securityContainer)
              );
            }
            return { [securityContainer.name]: [] };
          }),
      });
    }
    // add responses variants
    if (responses.length) {
      Object.assign(currentMethod, {
        responses: this.buildResponses(responses),
      });
    }
    // build request body data
    if (requestBody) {
      Object.assign(currentMethod, {
        requestBody: this.buildRequestBody(requestBody),
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

  // склеить и вернуть валидный список тегов по ключам
  mergeAndExtractTags(tagsKeys = []) {
    const { mergeSeparator } = this;
    const validTags = tagsKeys.filter((tagContainer) =>
      Reflect.getOwnMetadata(constants.OPENAPI_TAG, tagContainer)
    );

    const validTagsName = validTags.map((tagContainer) => {
      const tagData = Reflect.getOwnMetadata(constants.OPENAPI_TAG, tagContainer);
      if (!this.tagsSet.has(tagContainer)) {
        this.tagsSet.add(tagContainer);
        this.tagsMap.set(tagContainer, tagData);
      }
      return Reflect.get(tagData, "name");
    });

    // если в списке больше чем один тег, то производим хитрую операцию слияния
    if (validTags.length > 1) {
      const resultTagName = validTagsName.join(mergeSeparator);
      if (!this.tagsSet.has(resultTagName)) {
        // console.log("add new tags", { validTags });
        this.tagsSet.add(resultTagName);
        this.tagsMap.set(resultTagName, { name: resultTagName });
      } else {
        // console.log("this tags exists", validTags);
      }

      // console.log(this.tagsSet, this.tagsMap);

      return [resultTagName];
    } else {
      // иначе возвращаем то, что получилось (1 тег или пустой массив)
      return validTagsName;
    }
  }

  buildResponses(responses) {
    const result = {};
    responses.forEach((responseData) => {
      const { status, schema, description, isArray = false } = responseData;
      const { contentType = "application/json" } = responseData;
      const contentSchema = {};
      if (isArray) {
        Object.assign(contentSchema, {
          schema: { type: "array", items: schema },
        });
      } else {
        Object.assign(contentSchema, { schema });
      }
      const content = { [contentType]: contentSchema };
      result[status] = { description, content };
    });

    return result;
    // return undefined;
  }

  buildRequestBody(requestBody) {
    const result = {};

    const { contentType = "application/json", schema, description } = requestBody;

    const contentSchema = {};
    Object.assign(contentSchema, { schema });
    /*
    if (this.schemasSet.has(schema)) {
      const { name } = schema;
      Object.assign(contentSchema, {
        schema: { $ref: `#/components/schemas/${name}` },
      });
    } else {
      Object.assign(contentSchema, { schema });
    }
    */
    const content = { [contentType]: contentSchema };
    Object.assign(result, { description, content });

    return result;
    // return undefined;
  }

  // JSON generator of complete documentation
  toJSON() {
    // add tags data
    const tags = [];
    this.tagsSet.forEach((tagContainer) => tags.push(this.tagsMap.get(tagContainer)));
    // add security schemas
    const securitySchemes = {};
    this.securitySet.forEach((securityContainer) =>
      Object.assign(securitySchemes, {
        [securityContainer.name]: this.securityMap.get(securityContainer),
      })
    );
    //
    return Object.assign(
      {},
      {
        ...this.data,
        components: {
          // schemas: schemasSet2json(this.schemasSet),
          tags,
          securitySchemes,
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
exports.OpenApi = OpenApi;
