import * as constants from "../../common/constants";
import { FwdContainer } from "../forwards";
import { checkConstructorProperty } from "../../common/functions";
import { nextSequences } from "../functions";
import { ArgsFunction, HandlerFunction, IArgs } from "../../common/declares";

function _default(args: IArgs) {
  return args;
}

export function Args(handler: ArgsFunction = _default): ParameterDecorator {
  if (typeof handler !== "function") throw new Error(constants.PARAMETER_HANDLER_ERROR);
  return (constructor, property, parameterIndex) => {
    checkConstructorProperty(constructor, property);

    const metakey = constants.PARAMETERS_METADATA;
    // ...
    const propertyArguments = Reflect.getOwnMetadata(metakey, constructor, property) || [];
    // может быть стек декораторов, поэтому создадим для них список
    /*
    if (!propertyParameters[parameterIndex])
      propertyParameters[parameterIndex] = [];
      propertyParameters[parameterIndex].push(handler);
      */
    propertyArguments[parameterIndex] = handler;
    Reflect.defineMetadata(metakey, propertyArguments, constructor, property);
  };
}

// ---
export function Query(queryHandler: ArgsFunction = _default): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return Reflect.apply(queryHandler, null, [ctx.query]);
  };
  return Args(handler);
}

// ---
export function Params(paramName: string = undefined): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return paramName ? Reflect.get(ctx.params, paramName) : ctx.params;
  };
  return Args(handler);
}

// ---
export function State(stateName: string = undefined): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return stateName ? Reflect.get(ctx.state, stateName) : ctx.state;
  };
  return Args(handler);
}

// ---
export function Session(sessionName: string = undefined): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return sessionName ? Reflect.get(ctx.session, sessionName) : ctx.session;
  };
  return Args(handler);
}

// ---
export function Body(bodyHandler: ArgsFunction = _default): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return Reflect.apply(bodyHandler, null, [ctx.request.body]);
  };
  return Args(handler);
}

// ---
export function Files(): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return ctx.request.files;
  };
  return Args(handler);
}

// ---
export function Headers(headerName: string = undefined): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return headerName ? Reflect.get(ctx.headers, headerName) : ctx.headers;
  };
  return Args(handler);
}

// ---
export function Next(): ReturnType<typeof Args> {
  const handler = function (args: IArgs) {
    return (...handlers: HandlerFunction[]) => nextSequences(handlers, args);
  };
  return Args(handler);
}

// ---
export function Ctx() {
  const handler = function ({ ctx }: IArgs) {
    return ctx;
  };
  return Args(handler);
}

// ---
export function Err(ErrorConstructor = Error): ReturnType<typeof Args> {
  if (!(ErrorConstructor === Error || ErrorConstructor.prototype instanceof Error))
    throw new Error(constants.ERROR_CONSTRUCTOR_ERROR);
  const handler = function () {
    return function (message, status = 500, data = undefined) {
      return Object.assign(new ErrorConstructor(message), { status, data });
    };
  };
  return Args(handler);
}

// ---
export function Req(): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return ctx.request;
  };
  return Args(handler);
}

// ---
export function Res(): ReturnType<typeof Args> {
  const handler = function ({ ctx }) {
    return ctx.response;
  };
  return Args(handler);
}

// ---
export function Cursor(): ReturnType<typeof Args> {
  const handler = function ({ cursor }) {
    return cursor;
  };
  return Args(handler);
}

// ---
export function Route(): ReturnType<typeof Args> {
  const handler = function ({ route }) {
    return route;
  };
  return Args(handler);
}

// ---
export function StateMap(constructor = undefined): ReturnType<typeof Args> {
  const handler = ({ ctx }) => {
    // если используется `FwdRef`, то в качестве целевого значения используем результат функции
    if (constructor instanceof FwdContainer) {
      constructor = constructor.exec();
    }
    return constructor ? ctx.$StateMap.get(constructor) : ctx.$StateMap;
  };
  return Args(handler);
}

// ---
export function This(constructor = undefined): ReturnType<typeof Args> {
  if (constructor && !(constructor instanceof Function || constructor instanceof FwdContainer)) {
    throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
  }
  const handler = ({ ctx, cursor }) => {
    // если используется `FwdRef`, то в качестве целевого значения используем результат функции
    if (constructor instanceof FwdContainer) {
      constructor = constructor.exec();
    }
    constructor = constructor || cursor.constructor;
    let _this = ctx.$StateMap.get(constructor);
    if (!_this) {
      _this = Reflect.construct(constructor, []);
      ctx.$StateMap.set(constructor, _this);
    }
    return _this;
  };
  return Args(handler);
}
