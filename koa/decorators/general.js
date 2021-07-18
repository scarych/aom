"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Endpoint = void 0;
const constants = require("../constants");
function MixWith(source) {
  return function (constructor) {
    if (typeof constructor !== "function") throw new Error(constants.TARGET_TYPE_ERROR);

    /*
    const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
    const sourceMiddlewares = Reflect.getOwnMetadata(listMetakey, source) || [];
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

exports.MixWith = MixWith;

// --
function Router() {
  return (constructor) => {
    // разберем данные из хранилища и установим их в релевантные места
    const storage =
      Reflect.getOwnMetadata(constants.STORAGE_METADATA, constructor) || new WeakMap();

    const storageSet = storage.get(constants.STORAGE_SET_METADATA) || new Set();
    storageSet.forEach((metakey) => {
      // ...
      const metakeyData = storage.get(metakey);
      const metakeySet = metakeyData.get(constants.STORAGE_KEYS_SET_METADATA);
      metakeySet.forEach((storageKeys) => {
        // ...
        const keysData = metakeyData.get(storageKeys);
        Reflect.defineMetadata(metakey, keysData, ...storageKeys);
      });
    });
  };
}

exports.Router = Router;
