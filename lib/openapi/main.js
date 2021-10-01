"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenApi = void 0;
const constants = __importStar(require("../common/constants"));
const functions_1 = require("../common/functions");
const definitions_1 = require("./definitions");
const thisref_1 = require("./thisref");
class OpenApi {
    constructor(initData = {}) {
        this.mergeSeparator = "+";
        this.data = {
            openapi: "3.0.0",
        };
        this.tagsSet = new Set();
        this.tagsMap = new Map();
        this.securitySet = new Set();
        this.securityMap = new Map();
        this.paths = {};
        // ...
        Object.assign(this.data, { ...initData });
    }
    registerPath(route) {
        let { path, method, cursors } = route;
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
        cursors.forEach((cursor) => {
            // из остальных извлечем полезные данные
            const { constructor, property } = cursor;
            const cursorOpenApiData = (0, functions_1.getOpenAPIMetadata)(constructor, property);
            if (cursorOpenApiData) {
                // возьмем описание и название из текущего курсора и заменим значения итеративно
                const { description, summary } = cursorOpenApiData;
                Object.assign(currentMethod, { description, summary });
                // build request body data
                if (cursorOpenApiData.requestBody) {
                    Object.assign(currentMethod, {
                        requestBody: this.buildRequestBody(cursorOpenApiData.requestBody, constructor),
                    });
                }
                // если курсор совпадает с собственным роутером
                // то установим правило замены следующего тега, если он вдруг встретится
                if (cursor.handler === route.handler && route.path === cursor.prefix) {
                    nextTagRule = constants.NEXT_TAGS_REPLACE;
                }
                else if (cursorOpenApiData.nextTagRule) {
                    // иначе используем значение, если оно стоит для курсора
                    nextTagRule = cursorOpenApiData.nextTagRule;
                }
                // дальнейшие действия выполняются, если нет инструкции игнорировать следующие теги
                if (cursorOpenApiData.tag && nextTagRule !== constants.NEXT_TAGS_IGNORE) {
                    // если стоит инструкция замены тегов
                    if (nextTagRule === constants.NEXT_TAGS_REPLACE) {
                        tags = [cursorOpenApiData.tag];
                    }
                    else if (nextTagRule === constants.NEXT_TAGS_MERGE) {
                        tags.push(cursorOpenApiData.tag);
                    }
                }
                // if middleware has security rule
                if (cursorOpenApiData.security instanceof Array) {
                    security.push(...cursorOpenApiData.security);
                }
                // build responses in branch
                if (cursorOpenApiData.responses instanceof Array) {
                    responses.push(...cursorOpenApiData.responses.map((response) => [response, constructor]));
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
                if (cursorOpenApiData.parameters instanceof Array &&
                    cursorOpenApiData.parameters.length > 0) {
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
                    .filter((securityConstructor) => Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, securityConstructor))
                    .map((securityConstructor) => {
                    // внесем в справочник данные о протоколах безопасности
                    if (!this.securitySet.has(securityConstructor)) {
                        this.securitySet.add(securityConstructor);
                        this.securityMap.set(securityConstructor, Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, securityConstructor));
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
        if (!this.paths[path])
            this.paths[path] = {};
        this.paths[path][method] = currentMethod;
    }
    Data(data) {
        Object.assign(this.data, { ...data });
        return this;
    }
    // склеить и вернуть валидный список тегов по ключам
    mergeAndExtractTags(tagsKeys = []) {
        const { mergeSeparator } = this;
        const validTags = tagsKeys.filter((tagContainer) => Reflect.getOwnMetadata(constants.OPENAPI_TAG, tagContainer));
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
            }
            else {
                // console.log("this tags exists", validTags);
            }
            // console.log(this.tagsSet, this.tagsMap);
            return [resultTagName];
        }
        else {
            // иначе возвращаем то, что получилось (1 тег или пустой массив)
            return validTagsName;
        }
    }
    buildResponses(responses) {
        const result = {};
        responses.forEach((responseData) => {
            const [response, constructor] = responseData;
            const { status, description, isArray = false } = response;
            const { contentType = "application/json" } = response;
            const contentSchema = {};
            let schema;
            if (response.schema instanceof thisref_1.ThisRefContainer) {
                schema = response.schema.exec(constructor);
            }
            else {
                schema = response.schema;
            }
            if (isArray) {
                Object.assign(contentSchema, {
                    schema: { type: "array", items: schema },
                });
            }
            else {
                Object.assign(contentSchema, { schema });
            }
            const content = { [contentType]: contentSchema };
            result[status] = { description, content };
        });
        return result;
        // return undefined;
    }
    buildRequestBody(requestBody, constructor) {
        const result = {};
        const { contentType = "application/json", description } = requestBody;
        let schema;
        if (requestBody.schema instanceof thisref_1.ThisRefContainer) {
            schema = requestBody.schema.exec(constructor);
        }
        else {
            schema = requestBody.schema;
        }
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
        this.securitySet.forEach((securityConstructor) => Object.assign(securitySchemes, {
            [securityConstructor.name]: this.securityMap.get(securityConstructor),
        }));
        //
        return Object.assign({}, {
            ...this.data,
            definitions: (0, definitions_1.getDefinitions)(),
            components: {
                tags,
                securitySchemes,
            },
            paths: this.paths,
        });
    }
}
exports.OpenApi = OpenApi;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vcGVuYXBpL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtEQUFpRDtBQUVqRCxtREFBeUQ7QUFDekQsK0NBQStDO0FBQy9DLHVDQUE2QztBQUc3QyxNQUFhLE9BQU87SUFLbEIsWUFBWSxRQUFRLEdBQUcsRUFBRTtRQUp6QixtQkFBYyxHQUFHLEdBQUcsQ0FBQztRQUNyQixTQUFJLEdBQUc7WUFDTCxPQUFPLEVBQUUsT0FBTztTQUNqQixDQUFDO1FBTUYsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDcEIsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFFcEIsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV4QixVQUFLLEdBQUcsRUFBRSxDQUFDO1FBVlQsTUFBTTtRQUNOLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLEdBQUcsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBU0QsWUFBWSxDQUFDLEtBQWE7UUFDeEIsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRXRDLHdDQUF3QztRQUN4QyxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDekIsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLEVBQUUsQ0FBQztRQUNyQixNQUFNLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDcEIscUVBQXFFO1FBQ3JFOzs7Ozs7Ozs7O1VBVUU7UUFDRixpREFBaUQ7UUFDakQ7Ozs7OztVQU1FO1FBQ0YscUVBQXFFO1FBQ3JFLCtGQUErRjtRQUMvRixtR0FBbUc7UUFDbkcsbUNBQW1DO1FBQ25D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