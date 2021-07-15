"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Bridge = void 0;
const constants = require("../constants");
function Bridge(url, nextRoute) {
  return function (constructor, property = undefined) {
    if (typeof constructor !== "function") throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    const metakey = constants.BRIDGE_METADATA;
    // ...
    const bridges = Reflect.getOwnMetadata(metakey, constructor, property) || [];
    bridges.push({ url, nextRoute });
    Reflect.defineMetadata(metakey, bridges, constructor, property);
  };
}

exports.Bridge = Bridge;
