import { SchemaObject } from "openapi3-ts";
export * from "./decorators";
export declare class OpenApi {
  constructor(initData?: any);
  Data(data: any): OpenApi;
}

export declare function CombineSchemas(
  origin: Function,
  extensions: Record<string, Function | Function[]>
): SchemaObject;
