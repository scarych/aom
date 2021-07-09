"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Middlewares = void 0;
const constants = require("../constants");
function Middlewares(middlewares = []) {
  return function (target, propertyKey = null, descriptor = null) {
    const metakey = constants.MIDDLEWARE_METADATA;
    // ...
    const bridges = []
      .concat(Reflect.getOwnMetadata(metakey, target, propertyKey) || [])
      .concat(middlewares);
    Reflect.defineMetadata(metakey, bridges, target, propertyKey);
  };
}

exports.Middlewares = Middlewares;
