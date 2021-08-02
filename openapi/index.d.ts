import { SchemaObject, SecuritySchemeObject, TagObject } from "openapi3-ts";

// special extensions to fix bug with inheritance of SchemaObject
declare type OpenApiSchemaObject = Omit<SchemaObject, "type"> & {
  type?: SchemaObject["type"] | string;
};

export declare type AddTagObject = { [key: string]: TagObject };
export declare type AddSecurityScheme = { [key: string]: SecuritySchemeObject };

export declare interface OpenApiInfo {
  summary?: string;
  description?: string;
  tag?: string;
}

declare interface OpenApiParameterObject {
  name: string;
  description?: string;
  schema: OpenApiSchemaObject;
}

export declare interface OpenApiResponse {
  status: number;
  description: string;
  contentType?: string;
  isArray?: boolean;
  schema: OpenApiSchemaObject | Function | any;
}
export declare interface OpenApiRequestBody {
  description: string;
  contentType?: string;
  schema: OpenApiSchemaObject | Function | any;
}

export declare type OpenApiParameters = {
  [parameter: string]: OpenApiParameterObject;
};
declare class OpenApi {
  constructor(initData?: any);
  Data(data: any): OpenApi;
  // AddSchema(schemas: any): OpenApi;
  // AddSchemas(...schemas: any[]): OpenApi;
  AddTags(tags: AddTagObject): OpenApi;
  AddSecurity(security: AddSecurityScheme): OpenApi;
  Info(info: OpenApiInfo): MethodDecorator;
  Summary(summary: string): MethodDecorator;
  Description(description: string): MethodDecorator;
  Tag(tag: string): MethodDecorator;
  ReplaceNextTags(): MethodDecorator;
  IgnoreNextTags(): MethodDecorator;
  MergeNextTags(): MethodDecorator;
  Parameters(parameters: OpenApiParameters): MethodDecorator;
  Responses(...responses: OpenApiResponse[]): MethodDecorator;
  RequestBody(requestBody: OpenApiRequestBody): MethodDecorator;
  Security(securitySchemeName: string): MethodDecorator;
}

export default OpenApi;
