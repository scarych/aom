export declare interface $Args {
  route: $Route;
  cursor: $Cursor;
  next: $Next;
  ctx: $Ctx;
  metaMap: any;
  prefix: string;
  callstack: $Callstack;
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
export declare type $Next = () => Function;
export declare type $Err = (message: string, status: number) => Error;
export declare interface $Cursor {
  constructor: typeof Function;
  property: string;
  handler: Function;
  prefix: string;
}
export declare interface $Route extends Omit<$Cursor, "prefix"> {
  method: string;
  path: string;
  // callstack: $Callstack;
}

export declare type $Callstack = Function[];

export declare function Args(handler?: Function): ParameterDecorator;
export declare function Query(): ParameterDecorator;
export declare function Param(paramName?: string): ParameterDecorator;
export declare function State(stateName?: string): ParameterDecorator;
export declare function Session(sessionName?: string): ParameterDecorator;
export declare function Headers(headerName?: string): ParameterDecorator;
export declare function Body(): ParameterDecorator;
export declare function Files(fileName?: string): ParameterDecorator;
export declare function Ctx(): ParameterDecorator;
export declare function Next(): ParameterDecorator;
export declare function Err(): ParameterDecorator;
export declare function Req(): ParameterDecorator;
export declare function Res(): ParameterDecorator;

export declare function Callstack(): ParameterDecorator;
export declare function Cursor(): ParameterDecorator;
export declare function Route(): ParameterDecorator;
export declare function MetaMap(): ParameterDecorator;
