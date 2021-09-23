import * as constants from "../common/constants";
import { Constructor, ICursor, IRoute } from "../common/declares";
import { checkOpenAPIMetadata } from "../common/functions";
import { getDefinitions } from "./definitions";
import { OpenApiSchemaObject } from "./types";

export class OpenApi {
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
  registerPath(route: IRoute): void {
    let { constructor, property, path, method, cursors } = route;
    // const handlerOpenApiData = checkOpenAPIMetadata(constructor, property);
    // if (!handlerOpenApiData) return;

    // создадим заглушку для текущего метода
    const currentMethod = {};
    const parameters = [];
    const responses = [];
    const security = [];
    // если стоит собственный тег на ендпоинте, то он прироритетнее всего
    /*
    const {
      description,
      summary,
      responses = [],
      requestBody,
      tag,
      security = [],
      parameters = [],
    } = handlerOpenApiData;
    */
    // инициируем базовую информацию о текущем методе
    /*
    Object.assign(currentMethod, {
      description,
      summary,
      parameters,
    });
    */
    // далее следует сборка response, body и других контекстных значений,
    // которые в том числе опираются на структуры данных, которые следует дампить отдельным образом
    // миддлвари проходятся с начала и до последнего значения, и в конце обязательно должны стыковаться
    // собственные аналогичные значения
    // let lastTag; // последний найденный тег, который будет, если нет собственного
    let tags = []; // теги для слияния в потоке
    let nextTagRule = constants.NEXT_TAGS_REPLACE; // правило сборки тегов, по умолчанию - замена
    cursors.forEach((cursor: ICursor) => {
      // из остальных извлечем полезные данные
      const { constructor, property } = cursor;
      const cursorOpenApiData = checkOpenAPIMetadata(constructor, property);
      if (cursorOpenApiData) {
        // возьмем описание и название из текущего курсора и заменим значения итеративно
        const { description, summary } = cursorOpenApiData;
        Object.assign(currentMethod, { description, summary });

        // build request body data
        if (cursorOpenApiData.requestBody) {
          Object.assign(currentMethod, {
            requestBody: this.buildRequestBody(cursorOpenApiData.requestBody),
          });
        }

        // если курсор совпадает с собственным роутером
        // то установим правило замены следующего тега, если он вдруг встретится
        if (cursor.handler === route.handler && route.path === cursor.prefix) {
          nextTagRule = constants.NEXT_TAGS_REPLACE;
        } else if (cursorOpenApiData.nextTagRule) {
          // иначе используем значение, если оно стоит для курсора
          nextTagRule = cursorOpenApiData.nextTagRule;
        }
        // дальнейшие действия выполняются, если нет инструкции игнорировать следующие теги
        if (cursorOpenApiData.tag && nextTagRule !== constants.NEXT_TAGS_IGNORE) {
          // если стоит инструкция замены тегов
          if (nextTagRule === constants.NEXT_TAGS_REPLACE) {
            tags = [cursorOpenApiData.tag];
          } else if (nextTagRule === constants.NEXT_TAGS_MERGE) {
            tags.push(cursorOpenApiData.tag);
          }
        }

        // if middleware has security rule
        if (cursorOpenApiData.security instanceof Array) {
          security.push(...cursorOpenApiData.security);
        }

        // build responses in branch
        if (cursorOpenApiData.responses instanceof Array) {
          responses.push(...cursorOpenApiData.responses);
        }

        // build path parameters in branch
        if (cursorOpenApiData.pathParameters) {
          const { pathParameters } = cursorOpenApiData;

          // const currentParameters = currentMethod.parameters;
          Object.keys(pathParameters).forEach((parameterKey) => {
            const parameterProps = pathParameters[parameterKey];
            const { name } = parameterProps;
            // здесь происходит замена полного написания параметра на его openApi валидную нотацию
            path = path.replace(parameterKey, `{${name}}`);
            // добавим в список параметров новые значения, добавив значения по умолчанию
            // но не ограничив их наличие в других местах
            // (например та же query_string, выраженная в виде обязательного параметра)
            parameters.push({
              in: "path",
              required: true,
              ...parameterProps,
            });
          });
        }

        // если установлены общие параметры, то обогатим общий список
        if (
          cursorOpenApiData.parameters instanceof Array &&
          cursorOpenApiData.parameters.length > 0
        ) {
          parameters.push(...cursorOpenApiData.parameters);
        }
      }
    });

    // добавим только те теги, которые есть в общем хранилище
    if (tags.length) {
      Object.assign(currentMethod, {
        tags: this.mergeAndExtractTags(tags),
      });
    }

    // add security rules
    if (security.length) {
      Object.assign(currentMethod, {
        security: security
          .filter((securityConstructor) =>
            Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, securityConstructor)
          )
          .map((securityConstructor) => {
            // внесем в справочник данные о протоколах безопасности
            if (!this.securitySet.has(securityConstructor)) {
              this.securitySet.add(securityConstructor);
              this.securityMap.set(
                securityConstructor,
                Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, securityConstructor)
              );
            }
            return { [securityConstructor.name]: [] };
          }),
      });
    }

    // add responses variants
    if (responses.length) {
      Object.assign(currentMethod, {
        responses: this.buildResponses(responses),
      });
    }

    Object.assign(currentMethod, { parameters });
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
    this.securitySet.forEach((securityConstructor: Constructor) =>
      Object.assign(securitySchemes, {
        [securityConstructor.name]: this.securityMap.get(securityConstructor),
      })
    );
    //
    return Object.assign(
      {},
      {
        ...this.data,
        definitions: getDefinitions(),
        components: {
          tags,
          securitySchemes,
        },
        paths: this.paths,
      }
    );
  }
}
