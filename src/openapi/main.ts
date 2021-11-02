import YAML from "yaml";
import * as constants from "../common/constants";
import { Constructor, ICursor, IRoute } from "../common/declares";
import { getOpenAPIMetadata } from "../common/functions";
import { getComponentsSchemas, componentsSet, refPointerPrefix } from "./component-schema";
import { ThisRefContainer, RouteRefContainer } from "../references";
import { toJSONSchema } from "./functions";
import { getDisplayName } from "../special/display-name";

export class OpenApi {
  mergeSeparator = " > ";
  data = {
    openapi: "3.0.0",
  };
  constructor(initData = {}) {
    // ...
    Object.assign(this.data, { ...initData });
  }

  tagsSet = new Set();
  usedTagsSet = new Set();
  tagsMap = new Map();

  securitySet = new Set();
  securityMap = new Map();

  /** используемые id методов */
  usedIdSet = new Set();
  usedIdMap = new Map();

  paths = {};
  registerPath(route: IRoute): void {
    let { path, method, cursors } = route;
    const idParts = [];
    let id;
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
      /*
      if (!id && idParts.indexOf(constructor.name) < 0) {
        idParts.push(constructor.name);
      }
      */
      const cursorOpenApiData = getOpenAPIMetadata(constructor, property);
      if (cursorOpenApiData) {
        // build request body data
        if (cursorOpenApiData.requestBody) {
          Object.assign(currentMethod, {
            requestBody: this.buildRequestBody(cursorOpenApiData.requestBody, cursor, route),
          });
        }

        // если курсор совпадает с собственным роутером
        // то установим правило замены следующего тега, если он вдруг встретится
        if (cursor.handler === route.handler && route.path === cursor.prefix) {
          // возьмем описание и название из текущего курсора и заменим значения итеративно
          const { description, summary } = cursorOpenApiData;
          if (description) {
            Object.assign(currentMethod, { description });
          }
          if (summary) {
            Object.assign(currentMethod, { summary });
          }

          // создадим уникальный идентификатор, основанный на имени маршрутного узла
          // и имени свойства, которое определяет данный endpoint
          const methodId = getDisplayName(constructor, property);
          // если такого значения в set еще нет, то добавим его
          if (!this.usedIdSet.has(methodId)) {
            this.usedIdSet.add(methodId);
            // также создадим карту, в которой будут перечислены все варианты названий, если id будет повторяться
            this.usedIdMap.set(methodId, [methodId]);
            id = methodId;
          } else {
            // если значение уже используется, то добавим к нему число
            // равное количеству элементов в соответствуей карте
            const usedIdMap = this.usedIdMap.get(methodId);
            id = [methodId, usedIdMap.length].join("_");
            // обновим состав карты
            this.usedIdMap.set(methodId, [...usedIdMap, id]);
          }
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
          responses.push(
            ...cursorOpenApiData.responses.map((response) => ({
              response,
              cursor,
              route,
            }))
          );
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

        // если установлены параметры адресной строки, то обогатим общий список с установкой значения `in`
        if (
          cursorOpenApiData.queryParameters instanceof Array &&
          cursorOpenApiData.queryParameters.length > 0
        ) {
          parameters.push(
            ...cursorOpenApiData.queryParameters.map((queryParameter) => ({
              ...queryParameter,
              in: "query",
            }))
          );
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

    Object.assign(currentMethod, { parameters, operationId: id });
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
    let result;
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

      result = [resultTagName];
    } else {
      // иначе возвращаем то, что получилось (1 тег или пустой массив)
      result = [...validTagsName];
    }
    // добавим в список использованных тегов итоговое значение
    if (!this.usedTagsSet.has(result[0])) {
      this.usedTagsSet.add(result[0]);
    }
    return result;
  }

  buildResponses(responses) {
    const result = {};
    responses.forEach((responseData) => {
      const { response, cursor, route } = responseData;
      const { status, description, isArray = false } = response;
      const { contentType = "application/json" } = response;
      const contentSchema = {};
      let schema;
      if (response.schema instanceof ThisRefContainer) {
        schema = response.schema.exec(cursor.constructor);
      } else if (response.schema instanceof RouteRefContainer) {
        schema = response.schema.exec(route.constructor);
      } else {
        schema = response.schema;
      }

      if (componentsSet.has(schema)) {
        // const { name } = schema;
        const name = getDisplayName(schema);
        const $ref = `${refPointerPrefix}${name}`;
        if (isArray) {
          Object.assign(contentSchema, {
            schema: { type: "array", items: { $ref } },
          });
        } else {
          Object.assign(contentSchema, { schema: { $ref } });
        }
      } else {
        if (isArray) {
          Object.assign(contentSchema, {
            schema: { type: "array", items: toJSONSchema(schema) },
          });
        } else {
          Object.assign(contentSchema, { schema: toJSONSchema(schema) });
        }
      }

      const content = { [contentType]: contentSchema };
      result[status] = { description, content };
    });

    return result;
    // return undefined;
  }

  buildRequestBody(requestBody, cursor, route) {
    const result = {};

    const { contentType = "application/json", description } = requestBody;

    let schema;
    if (requestBody.schema instanceof ThisRefContainer) {
      schema = requestBody.schema.exec(cursor.constructor);
    } else if (requestBody.schema instanceof RouteRefContainer) {
      schema = requestBody.schema.exec(route.constructor);
    } else {
      schema = requestBody.schema;
    }

    const contentSchema = {};
    // Object.assign(contentSchema, { schema });
    // /*
    if (componentsSet.has(schema)) {
      // const { name } = schema;
      const name = getDisplayName(schema);
      Object.assign(contentSchema, {
        schema: { $ref: `${refPointerPrefix}${name}` },
      });
    } else {
      Object.assign(contentSchema, { schema: toJSONSchema(schema) });
    }
    // */
    const content = { [contentType]: contentSchema };
    Object.assign(result, { content });
    if (description) {
      Object.assign(result, { description });
    }
    return result;
    // return undefined;
  }

  // JSON generator of complete documentation
  toJSON() {
    // add tags data
    const tags = [];
    this.usedTagsSet.forEach((tagContainer) => tags.push({ name: tagContainer }));
    // add security schemas
    const securitySchemes = {};
    this.securitySet.forEach((securityConstructor: Constructor) =>
      Object.assign(securitySchemes, {
        [securityConstructor.name]: this.securityMap.get(securityConstructor),
      })
    );
    //
    return JSON.parse(
      JSON.stringify({
        ...this.data,
        components: {
          securitySchemes,
          schemas: getComponentsSchemas(),
        },
        tags,
        paths: this.paths,
      })
    );
  }

  toString() {
    const doc = new YAML.Document();
    doc.contents = this.toJSON();
    return doc.toString();
  }
}
