export declare interface $Args {
  target: $Target;
  cursor: $Cursor;
  next: $Next;
  ctx: $Ctx;
  routes: $Target[];
}
export declare interface $Ctx {
  req: any;
  res: any;
  headers: any;
  request: any;
  response: any;
  body: any;
  session: any;
  query: any;
}
export declare type $Next = (...handlers: Function[]) => Function;
export declare type $Err = <T extends Error>(message: string, status?: number, data?: any) => T;
export declare interface $Cursor {
  constructor: typeof Function;
  property: string;
  handler: Function;
  prefix: string;
}
export declare interface $Target extends Omit<$Cursor, "prefix"> {
  method: string;
  path: string;
  [key: string]: any;
}

export declare function Args(handler?: Function): ParameterDecorator;
export declare function Query(queryHandler?: Function): ParameterDecorator;
export declare function Body(bodyHandler?: Function): ParameterDecorator;
export declare function Param(paramName?: string): ParameterDecorator;
export declare function State(stateName?: string): ParameterDecorator;
export declare function Session(sessionName?: string): ParameterDecorator;
export declare function Headers(headerName?: string): ParameterDecorator;
export declare function Files(fileName?: string): ParameterDecorator;

export declare function Ctx(): ParameterDecorator;
export declare function Next(): ParameterDecorator;
export declare function Err<T extends typeof Error>(ErrorConstuctor?: T): ParameterDecorator;
export declare function Req(): ParameterDecorator;
export declare function Res(): ParameterDecorator;

export declare function Cursor(): ParameterDecorator;
export declare function Target(): ParameterDecorator;
export declare function Routes(): ParameterDecorator;

export declare function StateMap(constructor?: Function): ParameterDecorator;
export declare function This(...args: any[]): ParameterDecorator;
