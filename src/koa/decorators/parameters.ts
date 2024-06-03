import * as constants from "../../common/constants";
import { FwdContainer } from "../../references/forwards";
import { checkConstructorProperty } from "../../common/functions";
import { nextSequences } from "../functions";
import { ArgsFunction, ClassConstructor, HandlerFunction, IArgs } from "../../common/declares";
import { ThisRefContainer } from "../../references/this";
import { RouteRefContainer } from "../../references/route";

function _default(args: IArgs | any) {
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
export function Query(
  queryHandler: Function | ThisRefContainer | RouteRefContainer = _default
): ReturnType<typeof Args> {
  const handler = function ({ ctx, cursor, route }: IArgs) {
    let resultHandler = queryHandler;
    if (queryHandler instanceof ThisRefContainer) {
      resultHandler = queryHandler.exec(cursor.constructor);
    } else if (queryHandler instanceof RouteRefContainer) {
      resultHandler = queryHandler.exec(route.constructor);
    }

    return Reflect.apply(<Function>resultHandler, cursor.constructor, [ctx.query]);
  };
  return Args(handler);
}

// ---
export function Body(
  bodyHandler: Function | ThisRefContainer | RouteRefContainer = _default
): ReturnType<typeof Args> {
  const handler = function ({ ctx, cursor, route }: IArgs) {
    let resultHandler = bodyHandler;
    if (bodyHandler instanceof ThisRefContainer) {
      resultHandler = bodyHandler.exec(cursor.constructor);
    } else if (bodyHandler instanceof RouteRefContainer) {
      resultHandler = bodyHandler.exec(route.constructor);
    }
    return Reflect.apply(<Function>resultHandler, cursor.constructor, [ctx.request.body]);
  };
  return Args(handler);
}

// ---
export function Params(
  paramsHandler: Function | ThisRefContainer | RouteRefContainer | string = _default
): ReturnType<typeof Args> {
  const handler = function ({ ctx, route, cursor }: IArgs) {
    let resultHandler = paramsHandler;
    if (paramsHandler instanceof ThisRefContainer) {
      resultHandler = paramsHandler.exec(cursor.constructor);
    } else if (paramsHandler instanceof RouteRefContainer) {
      resultHandler = paramsHandler.exec(route.constructor);
    } else if ("string" === typeof paramsHandler) {
      return Reflect.get(ctx.params, paramsHandler);
    }
    return Reflect.apply(<Function>resultHandler, cursor.constructor, [ctx.params]);
  };
  return Args(handler);
}

// ---
export function State(stateName: string = undefined): ReturnType<typeof Args> {
  const handler = function ({ ctx }: IArgs) {
    return stateName ? Reflect.get(ctx.state, stateName) : ctx.state;
  };
  return Args(handler);
}

// ---
export function Session(sessionName: string = undefined): ReturnType<typeof Args> {
  const handler = function ({ ctx }: IArgs) {
    return sessionName ? Reflect.get(ctx.session, sessionName) : ctx.session;
  };
  return Args(handler);
}

// ---
export function Files(): ReturnType<typeof Args> {
  const handler = function ({ ctx }: IArgs) {
    return ctx.request.files;
  };
  return Args(handler);
}

// ---
export function Headers(
  headerHandler: Function | ThisRefContainer | RouteRefContainer | string = _default
): ReturnType<typeof Args> {
  const handler = function ({ ctx, cursor, route }: IArgs) {
    let resultHandler = headerHandler;
    if (headerHandler instanceof ThisRefContainer) {
      resultHandler = headerHandler.exec(cursor.constructor);
    } else if (headerHandler instanceof RouteRefContainer) {
      resultHandler = headerHandler.exec(route.constructor);
    } else if ("string" === typeof headerHandler) {
      return Reflect.get(ctx.headers, headerHandler);
    }
    return Reflect.apply(<Function>resultHandler, cursor.constructor, [ctx.headers]);
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
export function Err(ErrorConstructor: ClassConstructor = Error): ReturnType<typeof Args> {
  if (!(ErrorConstructor === Error || ErrorConstructor.prototype instanceof Error))
    throw new Error(constants.ERROR_CONSTRUCTOR_ERROR);
  const handler = function () {
    return function (message, status?, data?) {
      const error = new ErrorConstructor(message);
      status = status || error["status"] || Reflect.get(ErrorConstructor, "status");
      data = data || error["data"];
      return Object.assign(error, { status, data });
    };
  };
  return Args(handler);
}

// ---
export function Req(): ReturnType<typeof Args> {
  const handler = function ({ ctx }: IArgs) {
    return ctx.request;
  };
  return Args(handler);
}

// ---
export function Res(): ReturnType<typeof Args> {
  const handler = function ({ ctx }: IArgs) {
    return ctx.response;
  };
  return Args(handler);
}

// ---
export function Cursor(): ReturnType<typeof Args> {
  const handler = function ({ cursor }: IArgs) {
    return cursor;
  };
  return Args(handler);
}

// ---
export function Route(): ReturnType<typeof Args> {
  const handler = function ({ route }: IArgs) {
    return route;
  };
  return Args(handler);
}

// ---
export function StateMap(constructor = undefined): ReturnType<typeof Args> {
  const handler = ({ ctx }: IArgs) => {
    // если используется `FwdRef`, то в качестве целевого значения используем результат функции
    if (constructor instanceof FwdContainer) {
      constructor = constructor.exec();
    }
    return constructor ? ctx.$StateMap.get(constructor) : ctx.$StateMap;
  };
  return Args(handler);
}

// ---
export function This(
  constructor?: Function | FwdContainer | RouteRefContainer
): ReturnType<typeof Args> {
  if (
    constructor &&
    !(
      constructor instanceof Function ||
      constructor instanceof FwdContainer ||
      constructor instanceof RouteRefContainer
    )
  ) {
    throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
  }
  const handler = ({ ctx, cursor, route }: IArgs) => {
    let _constructor;
    if (constructor instanceof FwdContainer) {
      // если используется `FwdRef`, то в качестве целевого значения используем результат функции
      _constructor = constructor.exec();
    } else if (constructor instanceof RouteRefContainer) {
      // если используется RouteRef, то возвращается конструктор для текущего маршрута
      _constructor = constructor.exec(route.constructor);
    } else if (constructor) {
      _constructor = constructor;
    } else {
      _constructor = cursor.constructor;
    }

    let _this = ctx.$StateMap.get(_constructor);
    if (!_this) {
      _this = Reflect.construct(_constructor, []);
      ctx.$StateMap.set(_constructor, _this);
    }
    return _this;
  };
  return Args(handler);
}
