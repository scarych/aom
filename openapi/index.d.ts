declare class OpenApi {
  constructor(initData?: any);
  Data(data: any): OpenApi;
  Schemas(schemas: any): OpenApi;
  Summary(summary: string): MethodDecorator;
  Description(description: string): MethodDecorator;
  Tags(tags: string[]): MethodDecorator;
  Parameters(parameters: any): MethodDecorator;
  Responses(responses: any): MethodDecorator;
  RequestBody(requestBody: any): MethodDecorator;
  Security(security: any): MethodDecorator;
}

export default OpenApi;
