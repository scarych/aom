export declare type $Next = () => Function;
export declare type $Err = (message: string, status: number) => Error;

export declare function AddParameterDecorator(handler: Function): ParameterDecorator;
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
export declare function Target(): ParameterDecorator;
export declare function Data(): ParameterDecorator;
