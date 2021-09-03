"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { nextSequences } = require("../$");
// exports.AddParameterDecorator = void 0;
const constants = require("../../common/constants");
const { checkConstructorProperty } = require("../../common/functions");
const { FwdContainer } = require("../forwards");
// default args handler: extract all values
function _default(args) {
  return args;
}

function Args(handler = _default) {
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

exports.Args = Args;
// ---
function Query(queryHandler = _default) {
  const handler = function ({ ctx }) {
    return Reflect.apply(queryHandler, null, [ctx.query]);
  };
  return Args(handler);
}

exports.Query = Query;
// ---
function Params(paramName = undefined) {
  const handler = function ({ ctx }) {
    return paramName ? Reflect.get(ctx.params, paramName) : ctx.params;
  };
  return Args(handler);
}

exports.Params = Params;
// ---
function State(stateName = undefined) {
  const handler = function ({ ctx }) {
    return stateName ? Reflect.get(ctx.state, stateName) : ctx.state;
  };
  return Args(handler);
}

exports.State = State;
// ---
function Session(sessionName = undefined) {
  const handler = function ({ ctx }) {
    return sessionName ? Reflect.get(ctx.session, sessionName) : ctx.session;
  };
  return Args(handler);
}

exports.Session = Session;
// ---
function Body(bodyHandler = _default) {
  const handler = function ({ ctx }) {
    return Reflect.apply(bodyHandler, null, [ctx.request.body]);
  };
  return Args(handler);
}
exports.Body = Body;
// ---
function Files() {
  const handler = function ({ ctx }) {
    return ctx.request.files;
  };
  return Args(handler);
}
exports.Files = Files;
// ---
function Headers(headerName = undefined) {
  const handler = function ({ ctx }) {
    return headerName ? Reflect.get(ctx.headers, headerName) : ctx.headers;
  };
  return Args(handler);
}
exports.Headers = Headers;
// ---
function Next() {
  const handler = function (args) {
    return (...handlers) => nextSequences(handlers, args);
  };
  return Args(handler);
}
exports.Next = Next;
// ---
function Ctx() {
  const handler = function ({ ctx }) {
    return ctx;
  };
  return Args(handler);
}
exports.Ctx = Ctx;
// ---
function Err(ErrorConstructor = Error) {
  if (!(ErrorConstructor === Error || ErrorConstructor.prototype instanceof Error))
    throw new Error(constants.ERROR_CONSTRUCTOR_ERROR);
  const handler = function () {
    return function (message, status = 500, data = undefined) {
      return Object.assign(new ErrorConstructor(message), { status, data });
      /*
      const err = new Error(message);
      Object.assign(err, { status });
      Reflect.defineMetadata(constants.ERROR_METADATA, message, err, "message");
      Reflect.defineMetadata(constants.ERROR_METADATA, status, err, "status");
      return err;
      */
    };
  };
  return Args(handler);
}
exports.Err = Err;
// ---
function Req() {
  const handler = function ({ ctx }) {
    return ctx.request;
  };
  return Args(handler);
}
exports.Req = Req;
// ---
function Res() {
  const handler = function ({ ctx }) {
    return ctx.response;
  };
  return Args(handler);
}
exports.Res = Res;

// ---
function Cursor() {
  const handler = function ({ cursor }) {
    return cursor;
  };
  return Args(handler);
}
exports.Cursor = Cursor;
// ---
function Route() {
  const handler = function ({ route }) {
    return route;
  };
  return Args(handler);
}
exports.Route = Route;

// ---
function StateMap(constructor = undefined) {
  const handler = ({ ctx }) => {
    // если используется `FwdRef`, то в качестве целевого значения используем результат функции
    if (constructor instanceof FwdContainer) {
      constructor = constructor.exec();
    }
    return constructor ? ctx.$StateMap.get(constructor) : ctx.$StateMap;
  };
  return Args(handler);
}
exports.StateMap = StateMap;
// ---
function This(constructor = undefined) {
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
exports.This = This;
