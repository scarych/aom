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
exports.MergeNextTags = exports.IgnoreNextTags = exports.ReplaceNextTags = exports.RequestBody = exports.Responses = exports.Parameters = exports.PathParameters = exports.Description = exports.Summary = exports.UseSecurity = exports.AddSecurity = exports.UseTag = exports.AddTag = void 0;
const constants = __importStar(require("../common/constants"));
const functions_1 = require("../common/functions");
function mergeOpenAPIHandlerMetadata({ constructor, property = undefined }, data = {}) {
    const key = constants.OPEN_API_METADATA;
    const openapiMetadata = Reflect.getOwnMetadata(key, constructor, property) || {};
    Object.keys(data).forEach((key) => {
        if (data[key] instanceof Array) {
            const curData = openapiMetadata[key] || [];
            curData.push(...data[key]);
            openapiMetadata[key] = curData;
        }
        else {
            Object.assign(openapiMetadata, { [key]: data[key] });
        }
    });
    Reflect.defineMetadata(key, openapiMetadata, constructor, property);
}
function standartDecorator(data) {
    return function (constructor, property) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        // Reflect.defineMetadata(constants.OPEN_API_CONTAINER_METADATA, container, constructor, property);
        mergeOpenAPIHandlerMetadata({ constructor, property }, data);
    };
}
/**
 * Объявить текущую конструкцию тегом
 * @param tag { string | TagObject } имя тега или схема в спецификации OAS
 * @returns {ClassDecorator}
 */
function AddTag(tag) {
    return (constructor) => {
        (0, functions_1.checkConstructorProperty)(constructor);
        // если в качестве тега указано только имя, то используем непосредственно его в качестве схемы
        if (typeof tag === "string") {
            tag = { name: tag };
        }
        Reflect.defineMetadata(constants.OPENAPI_TAG, tag, constructor);
    };
}
exports.AddTag = AddTag;
/**
 * использовать конструкт с тегом
 * @param tag
 * @returns {MethodDecorator}
 */
function UseTag(tag) {
    // ...
    return standartDecorator({ tag });
}
exports.UseTag = UseTag;
function AddSecurity(securitySchema) {
    return (constructor) => {
        (0, functions_1.checkConstructorProperty)(constructor);
        Reflect.defineMetadata(constants.OPENAPI_SECURITY, securitySchema, constructor);
    };
}
exports.AddSecurity = AddSecurity;
function UseSecurity(...security) {
    // ...
    return standartDecorator({ security });
}
exports.UseSecurity = UseSecurity;
// значение добавляется только целенаправленно один раз
function Summary(summary) {
    // ...
    return standartDecorator({ summary });
}
exports.Summary = Summary;
// значение добавляется только целенаправленно один раз
function Description(description) {
    // ...
    return standartDecorator({ description });
}
exports.Description = Description;
function PathParameters(pathParameters) {
    // ...
    return standartDecorator({ pathParameters });
}
exports.PathParameters = PathParameters;
function Parameters(...parameters) {
    // ...
    return standartDecorator({ parameters });
}
exports.Parameters = Parameters;
function Responses(...responses) {
    // ...
    return standartDecorator({ responses });
}
exports.Responses = Responses;
function RequestBody(requestBody) {
    // ...
    return standartDecorator({ requestBody });
}
exports.RequestBody = RequestBody;
function ReplaceNextTags() {
    return standartDecorator({
        nextTagRule: constants.NEXT_TAGS_REPLACE,
    });
}
exports.ReplaceNextTags = ReplaceNextTags;
function IgnoreNextTags() {
    return standartDecorator({ nextTagRule: constants.NEXT_TAGS_IGNORE });
}
exports.IgnoreNextTags = IgnoreNextTags;
function MergeNextTags() {
    return standartDecorator({ nextTagRule: constants.NEXT_TAGS_MERGE });
}
exports.MergeNextTags = MergeNextTags;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vcGVuYXBpL2RlY29yYXRvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLCtEQUFpRDtBQUdqRCxtREFBK0Q7QUFTL0QsU0FBUywyQkFBMkIsQ0FBQyxFQUFFLFdBQVcsRUFBRSxRQUFRLEdBQUcsU0FBUyxFQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUU7SUFDbkYsTUFBTSxHQUFHLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFDO0lBQ3hDLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDakYsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUNoQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxLQUFLLEVBQUU7WUFDOUIsTUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMzQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDM0IsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQztTQUNoQzthQUFNO1lBQ0wsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDdEQ7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsSUFBSTtJQUM3QixPQUFP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