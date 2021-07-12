"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.AddParameterDecorator = void 0;
const constants = require("../constants");
function Arg(handler) {
  return (target, propertyKey, parameterIndex) => {
    if (typeof target !== "function") throw new Error(constants.TARGET_TYPE_ERROR);
    const metakey = constants.PARAMETERS_METADATA;
    // ...
    const propertyArguments = Reflect.getOwnMetadata(metakey, target, propertyKey) || [];
    // может быть стек декораторов, поэтому создадим для них список
    /*
    if (!propertyParameters[parameterIndex])
      propertyParameters[parameterIndex] = [];
      propertyParameters[parameterIndex].push(handler);
      */
    propertyArguments[parameterIndex] = handler;
    Reflect.defineMetadata(metakey, propertyArguments, target, propertyKey);
  };
}

exports.AddParameterDecorator = Arg;
// ---
function Query() {
  const handler = function (ctx) {
    return ctx.query;
  };
  return Arg(handler);
}

exports.Query = Query;
// ---
function Param(paramName = undefined) {
  const handler = function ({ ctx }) {
    return paramName ? Reflect.get(ctx.params, paramName) : ctx.params;
  };
  return Arg(handler);
}

exports.Param = Param;
// ---
function State(stateName = undefined) {
  const handler = function ({ ctx }) {
    return stateName ? Reflect.get(ctx.state, stateName) : ctx.state;
  };
  return Arg(handler);
}

exports.State = State;
// ---
function Session(sessionName = undefined) {
  const handler = function ({ ctx }) {
    return sessionName ? Reflect.get(ctx.session, sessionName) : ctx.session;
  };
  return Arg(handler);
}

exports.Session = Session;
// ---
function Body() {
  const handler = function ({ ctx }) {
    return ctx.request.body;
  };
  return Arg(handler);
}
exports.Body = Body;
// ---
function Files() {
  const handler = function ({ ctx }) {
    return ctx.request.files;
  };
  return Arg(handler);
}
exports.Files = Files;
// ---
function Headers(headerName = undefined) {
  const handler = function ({ ctx }) {
    return headerName ? Reflect.get(ctx.headers, headerName) : ctx.headers;
  };
  return Arg(handler);
}
exports.Headers = Headers;
// ---
function Next() {
  const handler = function ({ next }) {
    return () => next;
  };
  return Arg(handler);
}
exports.Next = Next;
// ---
function Ctx() {
  const handler = function ({ ctx }) {
    return ctx;
  };
  return Arg(handler);
}
exports.Ctx = Ctx;
// ---
function Err() {
  const handler = function () {
    return function (message, status = 500) {
      const err = new Error();
      Reflect.defineMetadata(constants.ERROR_METADATA, message, err, "message");
      Reflect.defineMetadata(constants.ERROR_METADATA, status, err, "status");
      return err;
    };
  };
  return Arg(handler);
}
exports.Err = Err;
// ---
function Target() {
  const handler = function ({ target }) {
    return target;
  };
  return Arg(handler);
}
exports.Target = Target;
// ---
function Current() {
  const handler = function ({ current }) {
    return current;
  };
  return Arg(handler);
}
exports.Current = Current;
// ---
function Origin() {
  const handler = function ({ origin }) {
    return origin;
  };
  return Arg(handler);
}
exports.Origin = Origin;
// ---
function Path() {
  const handler = function ({ path }) {
    return path;
  };
  return Arg(handler);
}
exports.Path = Path;
// ---
function Prefix() {
  const handler = function ({ prefix }) {
    return prefix;
  };
  return Arg(handler);
}
exports.Prefix = Prefix;
// ---
function Method() {
  const handler = function ({ method }) {
    return method;
  };
  return Arg(handler);
}
exports.Method = Method;
