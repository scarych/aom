import { SchemaObject, SecuritySchemeObject, TagObject } from "openapi3-ts/oas30";
import { RouteRefContainer } from "..";
import { ThisRefContainer } from "../references/this";

// special extensions to fix bug with inheritance of SchemaObject
export declare type OpenApiSchemaObject = Omit<SchemaObject, "type"> & {
  type?: SchemaObject["type"] | string;
};

export declare type OpenApiSecuritySchema = Omit<SecuritySchemeObject, "type"> & {
  type?: SecuritySchemeObject["type"] | string;
};

export declare interface OpenApiParameterObject {
  name: string;
  description?: string;
  in: "query" | "path" | "header" | "cookie" | string;
  required?: Boolean;
  schema: OpenApiSchemaObject | Function | ThisRefContainer | RouteRefContainer | any;
}

export declare interface OpenApiResponse {
  status: number;
  schema: OpenApiSchemaObject | Function | ThisRefContainer | RouteRefContainer | any;
  description: string;
  contentType?: string;
  isArray?: boolean;
}

export declare interface OpenApiRequestBody {
  description?: string;
  contentType?: string;
  schema: OpenApiSchemaObject | Function | ThisRefContainer | RouteRefContainer | any;
}

// для аргумента в декоратор PathParameters сделаем значение `in` необязательным
export declare type OpenApiPathParameterObject = Omit<OpenApiParameterObject, "in"> & {
  in?: OpenApiParameterObject["in"];
};

export declare type OpenApiPathParameters = {
  [parameter: string]: OpenApiPathParameterObject;
};
