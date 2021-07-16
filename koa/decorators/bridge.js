"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Bridge = void 0;
const constants = require("../constants");
function Bridge(url, nextRoute) {
  return function (constructor, property = undefined, descriptor = undefined) {
    if (typeof constructor !== "function") throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    const metakey = constants.BRIDGE_METADATA;
    // ...
    const bridges = Reflect.getOwnMetadata(metakey, constructor) || [];
    bridges.push({ url, nextRoute, constructor, property, descriptor });
    Reflect.defineMetadata(metakey, bridges, constructor);
  };
}

exports.Bridge = Bridge;
