"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.AddParameterDecorator = void 0;
const constants = require("../constants");

// default args handler: extract all values
function _args(args) {
  return args;
}

function Args(handler = _args) {
  if (typeof handler !== "function") throw new Error(constants.PARAMETER_HANDLER_ERROR);
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

exports.Args = Args;
// ---
function Query() {
  const handler = function ({ ctx }) {
    return ctx.query;
  };
  return Args(handler);
}

exports.Query = Query;
// ---
function Param(paramName = undefined) {
  const handler = function ({ ctx }) {
    return paramName ? Reflect.get(ctx.params, paramName) : ctx.params;
  };
  return Args(handler);
}

exports.Param = Param;
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
function Body() {
  const handler = function ({ ctx }) {
    return ctx.request.body;
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
  const handler = function ({ next }) {
    return () => next;
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
function Err() {
  const handler = function () {
    return function (message, status = 500) {
      const err = new Error(message);
      err.status = status;
      Reflect.defineMetadata(constants.ERROR_METADATA, message, err, "message");
      Reflect.defineMetadata(constants.ERROR_METADATA, status, err, "status");
      return err;
    };
  };
  return Args(handler);
}
exports.Err = Err;
// ---
function Target() {
  const handler = function ({ target }) {
    return target;
  };
  return Args(handler);
}
exports.Target = Target;
// ---
function Path() {
  const handler = function ({ path }) {
    return path;
  };
  return Args(handler);
}
exports.Path = Path;
// ---
function Prefix() {
  const handler = function ({ prefix }) {
    return prefix;
  };
  return Args(handler);
}
exports.Prefix = Prefix;
// ---
function Method() {
  const handler = function ({ method }) {
    return method;
  };
  return Args(handler);
}
exports.Method = Method;
// ---
function Handler() {
  const handler = function ({ handler }) {
    return handler;
  };
  return Args(handler);
}
exports.Handler = Handler;
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
