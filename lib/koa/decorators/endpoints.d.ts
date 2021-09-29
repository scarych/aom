import { HandlerFunction, HTTPMethods } from "../../common/declares";
/**
 *
 * @param method {HTTPMethods} метод endpoint-а
 * @param path {string} путь endpoint-а
 * @returns {MethodDecorator}
 */
export declare function Endpoint(method?: HTTPMethods, path?: string): MethodDecorator;
export declare function Get(path?: string): MethodDecorator;
export declare function Get(path: string, handler: HandlerFunction): ClassDecorator;
export declare function Post(path?: string): MethodDecorator;
export declare function Post(path: string, handler: HandlerFunction): ClassDecorator;
export declare function Patch(path?: string): MethodDecorator;
export declare function Patch(path: string, handler: HandlerFunction): ClassDecorator;
export declare function Put(path?: string): MethodDecorator;
export declare function Put(path: string, handler: HandlerFunction): ClassDecorator;
export declare function Options(path?: string): MethodDecorator;
export declare function Options(path: string, handler: HandlerFunction): ClassDecorator;
export declare function Delete(path?: string): MethodDecorator;
export declare function Delete(path: string, handler: HandlerFunction): ClassDecorator;
export declare function All(path?: string): MethodDecorator;
export declare function All(path: string, handler: HandlerFunction): ClassDecorator;
