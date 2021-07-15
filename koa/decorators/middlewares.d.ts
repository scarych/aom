type CombinedDecorator = <T extends Function>(target: T, propertyKey?: string) => void;
export declare function Use(...handlers: Function[]): CombinedDecorator;
export declare function Middleware(): MethodDecorator;
export declare function Marker(handler): MethodDecorator;
