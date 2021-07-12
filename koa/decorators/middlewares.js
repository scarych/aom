"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require("../constants");

function Use(...middlewares) {
  return function (target, propertyKey = undefined) {
    if (typeof target !== "function") throw new Error(constants.TARGET_TYPE_ERROR);
    const metakey = constants.MIDDLEWARE_METADATA;
    // ...
    const bridges = []
      .concat(Reflect.getOwnMetadata(metakey, target, propertyKey) || [])
      .concat(middlewares);
    Reflect.defineMetadata(metakey, bridges, target, propertyKey);
  };
}

exports.Use = Use;

function Middleware() {
  return function (target, propertyKey, descriptor) {
    if (typeof target !== "function") throw new Error(constants.TARGET_TYPE_ERROR);

    // save reverse data for specific handler
    if (typeof target === "function") {
      const metakey = constants.REVERSE_METADATA;
      Reflect.defineMetadata(metakey, { target, propertyKey }, target[propertyKey]);
    }

    const metakey = constants.IS_MIDDLEWARE_METADATA;
    Reflect.defineMetadata(metakey, true, target[propertyKey]);
  };
}

exports.Middleware = Middleware;
