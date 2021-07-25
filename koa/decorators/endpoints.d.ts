export declare enum Methods {
  GET = "get",
  POST = "post",
  PUT = "put",
  PATCH = "patch",
  DELETE = "delete",
  OPTIONS = "options",
  ALL = "all",
}

export declare function Endpoint(url?: string, method?: string): MethodDecorator;
export declare function Get(url?: string): MethodDecorator;
export declare function Post(url?: string): MethodDecorator;
export declare function Put(url?: string): MethodDecorator;
export declare function Delete(url?: string): MethodDecorator;
export declare function Options(url?: string): MethodDecorator;
export declare function Patch(url?: string): MethodDecorator;
export declare function All(url?: string): MethodDecorator;
