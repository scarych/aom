declare class OpenApi {
  constructor(initData?: any);
  Data(data: any): OpenApi;
  AddSchemas(schemas: any): OpenApi;
  AddTag(tag: any): OpenApi;
  Summary(summary: string): MethodDecorator;
  Description(description: string): MethodDecorator;
  Tags(tags: string[]): MethodDecorator;
  Parameters(parameters: any): MethodDecorator;
  Responses(responses: any): MethodDecorator;
  RequestBody(requestBody: any): MethodDecorator;
  Security(security: any): MethodDecorator;
}

export default OpenApi;
