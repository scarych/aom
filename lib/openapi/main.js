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
        Object.assign(this.data, { ...initData });
    }
    registerPath(route) {
        let { path, method, cursors } = route;
        const currentMethod = {};
        const parameters = [];
        const responses = [];
        const security = [];
        let tags = [];
        let nextTagRule = constants.NEXT_TAGS_REPLACE;
        cursors.forEach((cursor) => {
            const { constructor, property } = cursor;
            const cursorOpenApiData = (0, functions_1.getOpenAPIMetadata)(constructor, property);
            if (cursorOpenApiData) {
                const { description, summary } = cursorOpenApiData;
                Object.assign(currentMethod, { description, summary });
                if (cursorOpenApiData.requestBody) {
                    Object.assign(currentMethod, {
                        requestBody: this.buildRequestBody(cursorOpenApiData.requestBody, constructor),
                    });
                }
                if (cursor.handler === route.handler && route.path === cursor.prefix) {
                    nextTagRule = constants.NEXT_TAGS_REPLACE;
                }
                else if (cursorOpenApiData.nextTagRule) {
                    nextTagRule = cursorOpenApiData.nextTagRule;
                }
                if (cursorOpenApiData.tag && nextTagRule !== constants.NEXT_TAGS_IGNORE) {
                    if (nextTagRule === constants.NEXT_TAGS_REPLACE) {
                        tags = [cursorOpenApiData.tag];
                    }
                    else if (nextTagRule === constants.NEXT_TAGS_MERGE) {
                        tags.push(cursorOpenApiData.tag);
                    }
                }
                if (cursorOpenApiData.security instanceof Array) {
                    security.push(...cursorOpenApiData.security);
                }
                if (cursorOpenApiData.responses instanceof Array) {
                    responses.push(...cursorOpenApiData.responses.map((response) => [response, constructor]));
                }
                if (cursorOpenApiData.pathParameters) {
                    const { pathParameters } = cursorOpenApiData;
                    Object.keys(pathParameters).forEach((parameterKey) => {
                        const parameterProps = pathParameters[parameterKey];
                        const { name } = parameterProps;
                        path = path.replace(parameterKey, `{${name}}`);
                        parameters.push({
                            in: "path",
                            required: true,
                            ...parameterProps,
                        });
                    });
                }
                if (cursorOpenApiData.parameters instanceof Array &&
                    cursorOpenApiData.parameters.length > 0) {
                    parameters.push(...cursorOpenApiData.parameters);
                }
            }
        });
        if (tags.length) {
            Object.assign(currentMethod, {
                tags: this.mergeAndExtractTags(tags),
            });
        }
        if (security.length) {
            Object.assign(currentMethod, {
                security: security
                    .filter((securityConstructor) => Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, securityConstructor))
                    .map((securityConstructor) => {
                    if (!this.securitySet.has(securityConstructor)) {
                        this.securitySet.add(securityConstructor);
                        this.securityMap.set(securityConstructor, Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, securityConstructor));
                    }
                    return { [securityConstructor.name]: [] };
                }),
            });
        }
        if (responses.length) {
            Object.assign(currentMethod, {
                responses: this.buildResponses(responses),
            });
        }
        Object.assign(currentMethod, { parameters });
        if (!this.paths[path])
            this.paths[path] = {};
        this.paths[path][method] = currentMethod;
    }
    Data(data) {
        Object.assign(this.data, { ...data });
        return this;
    }
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
        if (validTags.length > 1) {
            const resultTagName = validTagsName.join(mergeSeparator);
            if (!this.tagsSet.has(resultTagName)) {
                this.tagsSet.add(resultTagName);
                this.tagsMap.set(resultTagName, { name: resultTagName });
            }
            else {
            }
            return [resultTagName];
        }
        else {
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
        const content = { [contentType]: contentSchema };
        Object.assign(result, { description, content });
        return result;
    }
    toJSON() {
        const tags = [];
        this.tagsSet.forEach((tagContainer) => tags.push(this.tagsMap.get(tagContainer)));
        const securitySchemes = {};
        this.securitySet.forEach((securityConstructor) => Object.assign(securitySchemes, {
            [securityConstructor.name]: this.securityMap.get(securityConstructor),
        }));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vcGVuYXBpL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtEQUFpRDtBQUVqRCxtREFBeUQ7QUFDekQsK0NBQStDO0FBQy9DLHVDQUE2QztBQUc3QyxNQUFhLE9BQU87SUFLbEIsWUFBWSxRQUFRLEdBQUcsRUFBRTtRQUp6QixtQkFBYyxHQUFHLEdBQUcsQ0FBQztRQUNyQixTQUFJLEdBQUc7WUFDTCxPQUFPLEVBQUUsT0FBTztTQUNqQixDQUFDO1FBTUYsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFDcEIsWUFBTyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFFcEIsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLGdCQUFXLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUV4QixVQUFLLEdBQUcsRUFBRSxDQUFDO1FBVFQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFTRCxZQUFZLENBQUMsS0FBYTtRQUN4QixJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFHdEMsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUN0QixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUM7UUFDckIsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFDO1FBMEJwQixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLFdBQVcsR0FBRyxTQUFTLENBQUMsaUJBQWlCLENBQUM7UUFDOUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQWUsRUFBRSxFQUFFO1lBRWxDLE1BQU0sRUFBRSxXQUFX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