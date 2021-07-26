import { SchemaObject, TagObject } from "openapi3-ts";

declare type OpenApiSchemaObject = Omit<SchemaObject, "type"> & {
  type?: SchemaObject["type"] | string;
};

export declare type AddTagObject = { [key: string]: TagObject };
export declare interface OpenApiInfo {
  summary?: string;
  description?: string;
  tags?: string[];
}

declare interface OpenApiParameterObject {
  name: string;
  description?: string;
  schema: OpenApiSchemaObject;
}
export declare type OpenApiParameters = { [parameter: string]: OpenApiParameterObject };
declare class OpenApi {
  constructor(initData?: any);
  Data(data: any): OpenApi;
  AddSchema(schemas: any): OpenApi;
  AddSchemas(...schemas: any[]): OpenApi;
  AddTag(tag: AddTagObject): OpenApi;
  Info(info: OpenApiInfo): MethodDecorator;
  Summary(summary: string): MethodDecorator;
  Description(description: string): MethodDecorator;
  Tags(...tags: string[]): MethodDecorator;
  Parameters(parameters: OpenApiParameters): MethodDecorator;
  Responses(responses: any): MethodDecorator;
  RequestBody(requestBody: any): MethodDecorator;
  Security(security: any): MethodDecorator;
}

export default OpenApi;
