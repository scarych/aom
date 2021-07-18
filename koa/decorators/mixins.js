"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Endpoint = void 0;
const constants = require("../constants");
function Mixin(source) {
  return function (constructor) {
    if (typeof constructor !== "function") throw new Error(constants.TARGET_TYPE_ERROR);

    const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
    const sourceMiddlewares = Reflect.getOwnMetadata(listMetakey, source) || [];
    // /*
    sourceMiddlewares.forEach(({ property, descriptor }) => {
      const reverseMetakey = constants.REVERSE_METADATA;

      const newHandler = (...args) => Reflect.apply(descriptor.value, constructor, args);
      // Reflect.set(constructor, property, newHandler);

      Reflect.defineProperty(constructor, property, { value: newHandler });
      // console.log(constructor, constructor[property]);

      Reflect.defineMetadata(reverseMetakey, { constructor, property }, constructor[property]);

      const metakey = constants.IS_MIDDLEWARE_METADATA;
      Reflect.defineMetadata(metakey, true, constructor[property]);

      const argumentsMetakey = constants.PARAMETERS_METADATA;
      // ...
      const propertyArguments = Reflect.getOwnMetadata(argumentsMetakey, source, property) || [];
      // console.log(propertyArguments, descriptor.value);
      Reflect.defineMetadata(argumentsMetakey, propertyArguments, constructor, property);
    });

    const targetMiddlewares = Reflect.getOwnMetadata(listMetakey, constructor) || [];
    targetMiddlewares.push(...sourceMiddlewares);
    Reflect.defineMetadata(listMetakey, targetMiddlewares, constructor);

    // */
  };
}

exports.Mixin = Mixin;

function Mix(source, constructor) {
  if (typeof constructor !== "function") throw new Error(constants.TARGET_TYPE_ERROR);

  const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
  const sourceMiddlewares = Reflect.getOwnMetadata(listMetakey, source) || [];
  // /*
  sourceMiddlewares.forEach(({ property, descriptor }) => {
    const reverseMetakey = constants.REVERSE_METADATA;

    const newHandler = (...args) => Reflect.apply(descriptor.value, constructor, args);
    // Reflect.set(constructor, property, newHandler);

    Reflect.defineProperty(constructor, property, { value: newHandler });
    // console.log(constructor, constructor[property]);

    Reflect.defineMetadata(reverseMetakey, { constructor, property }, constructor[property]);

    const metakey = constants.IS_MIDDLEWARE_METADATA;
    Reflect.defineMetadata(metakey, true, constructor[property]);

    const argumentsMetakey = constants.PARAMETERS_METADATA;
    // ...
    const propertyArguments = Reflect.getOwnMetadata(argumentsMetakey, source, property) || [];
    // console.log(propertyArguments, descriptor.value);
    Reflect.defineMetadata(argumentsMetakey, propertyArguments, constructor, property);
  });

  const targetMiddlewares = Reflect.getOwnMetadata(listMetakey, constructor) || [];
  targetMiddlewares.push(...sourceMiddlewares);
  Reflect.defineMetadata(listMetakey, targetMiddlewares, constructor);

  return constructor;
  // */
}

exports.Mix = Mix;
