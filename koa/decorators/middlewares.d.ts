type CombinedDecorator = <T extends Function>(
  target: T,
  propertyKey?: string,
  descriptor?: any
) => void;
export declare function Use(...handlers: Function[]): CombinedDecorator;
export declare function Middleware(): MethodDecorator;
export declare function Bridge(prefix: string, nextRoute: Function): CombinedDecorator;
export declare function Marker(handler): MethodDecorator;
export declare function Sticker(): MethodDecorator;
