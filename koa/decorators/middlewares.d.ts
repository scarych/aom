import { $Cursor, $Target } from "./parameters";

type CombinedDecorator = <T extends Function>(
  target: T,
  propertyKey?: string,
  descriptor?: any
) => void;

type markerHandler = (target: $Target, cursor: $Cursor) => void | unknown;

export declare function Use(...handlers: Function[]): CombinedDecorator;
export declare function Middleware(): MethodDecorator;
export declare function Bridge(prefix: string, nextRoute: Function): CombinedDecorator;
export declare function Marker(handler: markerHandler): MethodDecorator;
export declare function Sticker(): MethodDecorator;
