import { SchemaObject, SecuritySchemeObject, TagObject } from "openapi3-ts";

// special extensions to fix bug with inheritance of SchemaObject
declare type OpenApiSchemaObject = Omit<SchemaObject, "type"> & {
  type?: SchemaObject["type"] | string;
};

declare type OpenApiSecuritySchema = Omit<SecuritySchemeObject, "type"> & {
  type?: SecuritySchemeObject["type"] | string;
};

declare interface OpenApiParameterObject {
  name: string;
  description?: string;
  in: "query" | "path" | "header" | "cookie" | string;
  required?: Boolean;
  schema: OpenApiSchemaObject;
}

export declare interface OpenApiResponse {
  status: number;
  schema: OpenApiSchemaObject | Function | any;
  description?: string;
  contentType?: string;
  isArray?: boolean;
}
export declare interface OpenApiRequestBody {
  description: string;
  contentType?: string;
  schema: OpenApiSchemaObject | Function | any;
}

// для аргумента в декоратор PathParameters сделаем значение `in` необязательным
export declare type OpenApiPathParameterObject = Omit<OpenApiParameterObject, "in"> & {
  in?: OpenApiParameterObject["in"];
};

export declare type OpenApiPathParameters = {
  [parameter: string]: OpenApiPathParameterObject;
};

export declare function AddDefinition(): ClassDecorator;
export declare function AddTag(tagSchema: TagObject): ClassDecorator;
export declare function UseTag(tagContainer: Function): MethodDecorator;
export declare function ReplaceNextTags(): MethodDecorator;
export declare function IgnoreNextTags(): MethodDecorator;
export declare function MergeNextTags(): MethodDecorator;
export declare function AddSecurity(securitySchema: OpenApiSecuritySchema): ClassDecorator;
export declare function UseSecurity(securityContainer: Function): MethodDecorator;
export declare function Summary(summary: string): MethodDecorator;
export declare function Description(description: string): MethodDecorator;
export declare function PathParameters(pathParameters: OpenApiPathParameters): MethodDecorator;
export declare function Parameters(...parameters: OpenApiParameterObject[]): MethodDecorator;
export declare function Responses(...responses: OpenApiResponse[]): MethodDecorator;
export declare function RequestBody(requestBody: OpenApiRequestBody): MethodDecorator;
