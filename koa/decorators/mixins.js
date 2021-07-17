"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Endpoint = void 0;
const constants = require("../constants");
function Mixin(source) {
  return function (constructor) {
    if (typeof constructor !== "function") throw new Error(constants.TARGET_TYPE_ERROR);

    const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
    const sourceMiddlewares = Reflect.getOwnMetadata(listMetakey, source) || [];

    sourceMiddlewares.forEach((property) => {
      const reverseMetakey = constants.REVERSE_METADATA;

      /*
      const sourceMetadata = Reflect.defineMetadata(
        reverseMetakey,
        { constructor, property },
        source[propertyName]
      );
      */

      Reflect.defineMetadata(reverseMetakey, { constructor: target, property }, target[property]);

      const metakey = constants.IS_MIDDLEWARE_METADATA;
      Reflect.defineMetadata(metakey, true, target[property]);
    });
  };
}

exports.Mixin = Mixin;
