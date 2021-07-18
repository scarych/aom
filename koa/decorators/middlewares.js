"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require("../constants");
const { saveStorageMetadata } = require("../helpers");

// ...
function Use(...middlewares) {
  return function (constructor, property = undefined) {
    if (typeof constructor !== "function") throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    saveStorageMetadata(
      constructor,
      constants.MIDDLEWARE_METADATA,
      middlewares,
      [constructor, property],
      true
    );
    /*
    const metakey = constants.MIDDLEWARE_METADATA;
    // ...
    const bridges = []
      .concat(Reflect.getOwnMetadata(metakey, constructor, property) || [])
      .concat(middlewares);
    Reflect.defineMetadata(metakey, bridges, constructor, property);
    */
  };
}

exports.Use = Use;

// ...
function Middleware() {
  return function (constructor, property, descriptor) {
    if (typeof constructor !== "function") throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    /*
    const { value } = descriptor;
    const handler = (...args) => {
      const rawData = Reflect.getOwnMetadata(constants.MIDDLEWARE_RAW_METADATA, handler);
      return Reflect.apply(rawData.descriptorValue, rawData.constructor, args);
    };
    descriptor.value = handler;
    // сохраним в контексте конструктора список
    const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
    const middlewaresList = Reflect.getOwnMetadata(listMetakey, constructor) || [];
    middlewaresList.push({ property, descriptor });
    Reflect.defineMetadata(listMetakey, middlewaresList, constructor);

    // save reverse data for specific handler
    if (typeof constructor === "function") {
      const metakey = constants.REVERSE_METADATA;
      Reflect.defineMetadata(metakey, { constructor, property }, handler);
    }

    Reflect.defineMetadata(
      constants.MIDDLEWARE_RAW_METADATA,
      { descriptorValue: value, constructor, property },
      handler
    );
    

    Reflect.defineMetadata(constants.IS_MIDDLEWARE_METADATA, true, handler);
    */
    saveStorageMetadata(constructor, constants.REVERSE_METADATA, { constructor, property }, [
      handler,
    ]);

    saveStorageMetadata(constructor, constants.IS_MIDDLEWARE_METADATA, true, [handler]);
  };
}

exports.Middleware = Middleware;

// ...
function Marker(handler) {
  return function (constructor, property, descriptor) {
    if (typeof constructor !== "function") throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    const markerName = `${constructor.name}:${property}`;
    /*
    const metakey = constants.MARKERS_METADATA;
    // ...
    const markers = Reflect.getOwnMetadata(metakey, constructor, property) || [];
    markers.push({ handler, constructor, descriptor, markerName });
    Reflect.defineMetadata(metakey, markers, constructor, property);
    */
    saveStorageMetadata(
      constructor,
      constants.MARKERS_METADATA,
      { handler, constructor, descriptor, markerName },
      [constructor, property],
      true
    );
  };
}

exports.Marker = Marker;

// ...
function Bridge(url, nextRoute) {
  return function (constructor, property = undefined, descriptor = undefined) {
    if (typeof constructor !== "function") throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    /*
    const metakey = constants.BRIDGE_METADATA;
    // ...
    const bridges = Reflect.getOwnMetadata(metakey, constructor) || [];
    bridges.push({ url, nextRoute, constructor, property, descriptor });
    Reflect.defineMetadata(metakey, bridges, constructor);
    */
    saveStorageMetadata(
      constructor,
      constants.BRIDGE_METADATA,
      { url, nextRoute, constructor, property, descriptor },
      [constructor],
      true
    );
  };
}

exports.Bridge = Bridge;
