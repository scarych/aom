import { TagObject } from "openapi3-ts";

declare class OpenApi {
  constructor(initData?: any);
  Data(data: any): OpenApi;
  AddSchema(schemas: any): OpenApi;
  AddSchemas(schemas: any[]): OpenApi;
  AddTag(tag: TagObject): OpenApi;
  Summary(summary: string): MethodDecorator;
  Description(description: string): MethodDecorator;
  Tags(tags: string[]): MethodDecorator;
  Parameters(parameters: any): MethodDecorator;
  Responses(responses: any): MethodDecorator;
  RequestBody(requestBody: any): MethodDecorator;
  Security(security: any): MethodDecorator;
}

export default OpenApi;
