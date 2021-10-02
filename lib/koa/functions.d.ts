import { Constructor, ConstructorProperty, HandlerFunction, IArgs, ICursor, IRoute, Property } from "../common/declares";
export declare function safeJSON<T = IRoute | ICursor>(data: T): T;
export declare function saveReverseMetadata(constructor: Constructor, property: Property): void;
export declare function restoreReverseMetadata(handler: HandlerFunction): ConstructorProperty;
export declare function nextSequences(handlers: HandlerFunction[], contextArgs: IArgs): Promise<any>;
export declare function extractParameterDecorators(constructor: Constructor, property: Property): any;
export declare function extractMiddlewares(origin: ConstructorProperty, prefix: string): ICursor[];
