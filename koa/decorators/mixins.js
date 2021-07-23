"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Endpoint = void 0;
const constants = require("../../common/constants");

function Mixin(source) {
  return function (constructor) {
    if (typeof constructor !== "function") throw new Error(constants.TARGET_TYPE_ERROR);

    const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
    const sourceMiddlewares = Reflect.getOwnMetadata(listMetakey, source) || [];

    sourceMiddlewares.forEach(({ property, descriptor }) => {
      const reverseMetakey = constants.REVERSE_METADATA;

      Reflect.set(constructor, property, descriptor);
      /*
      const sourceMetadata = Reflect.defineMetadata(
        reverseMetakey,
        { constructor, property },
        source[propertyName]
      );
      */

      Reflect.defineMetadata(reverseMetakey, { constructor, property }, constructor[property]);

      const metakey = constants.IS_MIDDLEWARE_METADATA;
      Reflect.defineMetadata(metakey, true, constructor[property]);
    });
  };
}

exports.Mixin = Mixin;
