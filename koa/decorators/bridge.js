"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Bridge = void 0;
const constants = require("../constants");
function Bridge(url, nextRoute) {
  return function (target) {
    if (typeof target !== "function") throw new Error(constants.TARGET_TYPE_ERROR);
    const metakey = constants.BRIDGE_METADATA;
    // ...
    const bridges = Reflect.getOwnMetadata(metakey, target) || [];
    bridges.push({ url, nextRoute });
    Reflect.defineMetadata(metakey, bridges, target);
  };
}

exports.Bridge = Bridge;
