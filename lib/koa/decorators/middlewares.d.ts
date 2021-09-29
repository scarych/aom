import { CombinedDecorator, MarkerHandler, MiddlewareHandler } from "../../common/declares";
export declare function Use(...middlewares: MiddlewareHandler[]): CombinedDecorator;
export declare function Middleware(): MethodDecorator;
export declare function Bridge(prefix: any, nextRoute: any): CombinedDecorator;
export declare function Marker(handler: MarkerHandler): MethodDecorator;
export declare function Sticker(): MethodDecorator;
