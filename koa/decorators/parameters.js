"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.AddParameterDecorator = void 0;
const constants = require("../constants");
function AddParameterDecorator(handler) {
  return (target, propertyKey, parameterIndex) => {
    if (typeof target !== "function") throw new Error(constants.TARGET_TYPE_ERROR);
    const metakey = constants.PARAMETERS_METADATA;

    // if use static method of class, then will store metadata for it with info about
    // origin class and propertyName, for futher usage
    if (typeof target === "function") {
      const metakey = constants.STATICS_REVERSE_METADATA;
      Reflect.defineMetadata(metakey, { target, propertyKey }, target[propertyKey]);
    }
    // */
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

exports.AddParameterDecorator = AddParameterDecorator;
// ---
function Query() {
  const handler = function (ctx) {
    return ctx.query;
  };
  return AddParameterDecorator(handler);
}

exports.Query = Query;
// ---
function Param(paramName = undefined) {
  const handler = function (ctx) {
    return paramName ? Reflect.get(ctx.params, paramName) : ctx.params;
  };
  return AddParameterDecorator(handler);
}

exports.Param = Param;
// ---
function State(stateName = undefined) {
  const handler = function (ctx) {
    return stateName ? Reflect.get(ctx.state, stateName) : ctx.state;
  };
  return AddParameterDecorator(handler);
}

exports.State = State;
// ---
function Body() {
  const handler = function (ctx) {
    return ctx.request.body;
  };
  return AddParameterDecorator(handler);
}
exports.Body = Body;
// ---
function Files() {
  const handler = function (ctx) {
    return ctx.request.files;
  };
  return AddParameterDecorator(handler);
}
exports.Files = Files;
// ---
function Headers(headerName = undefined) {
  const handler = function (ctx) {
    return headerName ? Reflect.get(ctx.headers, headerName) : ctx.headers;
  };
  return AddParameterDecorator(handler);
}
exports.Headers = Headers;
// ---
function Next() {
  const handler = function (ctx, next) {
    return () => next;
  };
  return AddParameterDecorator(handler);
}
exports.Next = Next;
// ---
function Ctx() {
  const handler = function (ctx) {
    return ctx;
  };
  return AddParameterDecorator(handler);
}
exports.Ctx = Ctx;
// ---
function Err() {
  const handler = function (ctx) {
    return function (message, status = 500) {
      const err = new Error();
      Reflect.defineMetadata(constants.ERROR_METADATA, message, err, "message");
      Reflect.defineMetadata(constants.ERROR_METADATA, status, err, "status");
      return err;
    };
  };
  return AddParameterDecorator(handler);
}
exports.Err = Err;
