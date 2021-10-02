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
        mergeOpenAPIHandlerMetadata({ constructor, property }, data);
    };
}
function AddTag(tag) {
    return (constructor) => {
        (0, functions_1.checkConstructorProperty)(constructor);
        if (typeof tag === "string") {
            tag = { name: tag };
        }
        Reflect.defineMetadata(constants.OPENAPI_TAG, tag, constructor);
    };
}
exports.AddTag = AddTag;
function UseTag(tag) {
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
    return standartDecorator({ security });
}
exports.UseSecurity = UseSecurity;
function Summary(summary) {
    return standartDecorator({ summary });
}
exports.Summary = Summary;
function Description(description) {
    return standartDecorator({ description });
}
exports.Description = Description;
function PathParameters(pathParameters) {
    return standartDecorator({ pathParameters });
}
exports.PathParameters = PathParameters;
function Parameters(...parameters) {
    return standartDecorator({ parameters });
}
exports.Parameters = Parameters;
function Responses(...responses) {
    return standartDecorator({ responses });
}
exports.Responses = Responses;
function RequestBody(requestBody) {
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