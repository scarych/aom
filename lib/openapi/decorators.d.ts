import { TagObject } from "openapi3-ts";
import { Constructor } from "../common/declares";
import { OpenApiParameterObject, OpenApiPathParameters, OpenApiRequestBody, OpenApiResponse, OpenApiSecuritySchema } from "./types";
/**
 * Объявить текущую конструкцию тегом
 * @param tag { string | TagObject } имя тега или схема в спецификации OAS
 * @returns {ClassDecorator}
 */
export declare function AddTag(tag: string | TagObject): ClassDecorator;
/**
 * использовать конструкт с тегом
 * @param tag
 * @returns {MethodDecorator}
 */
export declare function UseTag(tag: Constructor): MethodDecorator;
export declare function AddSecurity(securitySchema: OpenApiSecuritySchema): ClassDecorator;
export declare function UseSecurity(...security: Constructor[]): MethodDecorator;
export declare function Summary(summary: string): MethodDecorator;
export declare function Description(description: string): MethodDecorator;
export declare function PathParameters(pathParameters: OpenApiPathParameters): MethodDecorator;
export declare function Parameters(...parameters: OpenApiParameterObject[]): MethodDecorator;
export declare function Responses(...responses: OpenApiResponse[]): MethodDecorator;
export declare function RequestBody(requestBody: OpenApiRequestBody): MethodDecorator;
export declare function ReplaceNextTags(): MethodDecorator;
export declare function IgnoreNextTags(): MethodDecorator;
export declare function MergeNextTags(): MethodDecorator;
