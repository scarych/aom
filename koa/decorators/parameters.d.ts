export declare interface IArgs {
  target: ITarget;
  cursor: ICursor;
  next: Function;
  ctx: $Ctx;
  routes: ITarget[];
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
export declare type NextFunction = (...middlewares: Function[]) => Function;
export declare type ErrorFunction = <T extends Error>(
  message: string,
  status?: number,
  data?: any
) => T;
export declare interface ICursor {
  constructor: typeof Function;
  property: string;
  handler: Function;
  prefix: string;
}
export declare interface ITarget extends Omit<ICursor, "prefix"> {
  method: string;
  path: string;
  [key: string]: any;
}

export declare function Args(handler?: Function): ParameterDecorator;
export declare function Query(queryHandler?: Function): ParameterDecorator;
export declare function Body(bodyHandler?: Function): ParameterDecorator;
export declare function Params(paramName?: string): ParameterDecorator;
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
export declare function This(constructor?: Function): ParameterDecorator;
