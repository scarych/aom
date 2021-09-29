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
                        requestBody: this.buildRequestBody(cursorOpenApiData.requestBody),
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
            const { status, schema, description, isArray = false } = responseData;
            const { contentType = "application/json" } = responseData;
            const contentSchema = {};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vcGVuYXBpL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtEQUFpRDtBQUVqRCxtREFBeUQ7QUFDekQsK0NBQStDO0FBRy9DLE1BQWEsT0FBTztJQUtsQixZQUFZLFFBQVEsR0FBRyxFQUFFO1FBSnpCLG1CQUFjLEdBQUcsR0FBRyxDQUFDO1FBQ3JCLFNBQUksR0FBRztZQUNMLE9BQU8sRUFBRSxPQUFPO1NBQ2pCLENBQUM7UUFNRixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNwQixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVwQixnQkFBVyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDeEIsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXhCLFVBQUssR0FBRyxFQUFFLENBQUM7UUFWVCxNQUFNO1FBQ04sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFTRCxZQUFZLENBQUMsS0FBYTtRQUN4QixJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFdEMsd0NBQXdDO1FBQ3hDLE1BQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN6QixNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFDdEIsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNwQixxRUFBcUU7UUFDckU7Ozs7Ozs7Ozs7VUFVRTtRQUNGLGlEQUFpRDtRQUNqRDs7Ozs7O1VBTUU7UUFDRixxRUFBcUU7UUFDckUsK0ZBQStGO1FBQy9GLG1HQUFtRztRQUNuRyxtQ0FBbUM7UUFDbkMsZ0ZBQWdGO1FBQ2hG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