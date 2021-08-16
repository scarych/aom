export declare interface IArgs {
  route: IRoute;
  cursor: ICursor;
  next: Function;
  ctx: $Ctx;
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
export declare interface IRoute extends Omit<ICursor, "prefix"> {
  method: string;
  path: string;
  middlewares: Function[];
  callstack: Function[];
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
export declare function Err(ErrorConstuctor?: Function): ParameterDecorator;
export declare function Req(): ParameterDecorator;
export declare function Res(): ParameterDecorator;

export declare function Cursor(): ParameterDecorator;
export declare function Route(): ParameterDecorator;

export declare function StateMap(constructor?: Function): ParameterDecorator;
export declare function This(constructor?: Function): ParameterDecorator;
