export type HTTPMethods = "get" | "post" | "put" | "patch" | "delete" | "options" | "all";

export declare function Endpoint(url?: string, method?: HTTPMethods): MethodDecorator;
export declare function Get(url?: string): MethodDecorator;
export declare function Post(url?: string): MethodDecorator;
export declare function Put(url?: string): MethodDecorator;
export declare function Delete(url?: string): MethodDecorator;
export declare function Options(url?: string): MethodDecorator;
export declare function Patch(url?: string): MethodDecorator;
export declare function All(url?: string): MethodDecorator;
