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
        cursors.forEach((cursor) => {
            // из остальных извлечем полезные данные
            const { constructor, property } = cursor;
            const cursorOpenApiData = (0, functions_1.checkOpenAPIMetadata)(constructor, property);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vcGVuYXBpL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtEQUFpRDtBQUVqRCxtREFBMkQ7QUFDM0QsK0NBQStDO0FBRy9DLE1BQWEsT0FBTztJQUtsQixZQUFZLFFBQVEsR0FBRyxFQUFFO1FBSnpCLG1CQUFjLEdBQUcsR0FBRyxDQUFDO1FBQ3JCLFNBQUksR0FBRztZQUNMLE9BQU8sRUFBRSxPQUFPO1NBQ2pCLENBQUM7UUFNRixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNwQixZQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUVwQixnQkFBVyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDeEIsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRXhCLFVBQUssR0FBRyxFQUFFLENBQUM7UUFWVCxNQUFNO1FBQ04sTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFTRCxZQUFZLENBQUMsS0FBYTtRQUN4QixJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFDdEMsMEVBQTBFO1FBQzFFLG1DQUFtQztRQUVuQyx3Q0FBd0M7UUFDeEMsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUN0QixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDckIsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ3BCLHFFQUFxRTtRQUNyRTs7Ozs7Ozs7OztVQVVFO1FBQ0YsaURBQWlEO1FBQ2pEOzs7Ozs7VUFNRTtRQUNGLHFFQUFxRTtRQUNyRSwrRkFBK0Y7UUFDL0YsbUdBQW1HO1FBQ25H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