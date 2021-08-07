"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require("../../common/constants");
const { checkConstructorProperty, reverseMetadata } = require("../../common/functions");

// ...
function Use(...middlewares) {
  return function (constructor, property = undefined) {
    checkConstructorProperty(constructor, property);

    const metakey = constants.MIDDLEWARE_METADATA;
    // ...
    const bridges = []
      .concat(Reflect.getOwnMetadata(metakey, constructor, property) || [])
      .concat(middlewares);
    Reflect.defineMetadata(metakey, bridges, constructor, property);
  };
}

exports.Use = Use;

// ...
function Middleware() {
  return function (constructor, property, descriptor) {
    checkConstructorProperty(constructor, property);
    reverseMetadata(constructor, property);

    // сохраним в контексте конструктора список
    const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
    const middlewaresList = Reflect.getOwnMetadata(listMetakey, constructor) || [];
    middlewaresList.push({ property, descriptor });
    Reflect.defineMetadata(listMetakey, middlewaresList, constructor);

    const metakey = constants.IS_MIDDLEWARE_METADATA;
    Reflect.defineMetadata(metakey, true, constructor[property]);
  };
}

exports.Middleware = Middleware;

// ...
function Bridge(prefix, nextRoute) {
  return function (constructor, property = undefined, descriptor = undefined) {
    checkConstructorProperty(constructor, property);

    const metakey = constants.BRIDGE_METADATA;
    // ...
    const bridges = Reflect.getOwnMetadata(metakey, constructor) || [];
    bridges.push({ prefix, nextRoute, constructor, property, descriptor });
    Reflect.defineMetadata(metakey, bridges, constructor);
  };
}

exports.Bridge = Bridge;

// ...
function Marker(handler) {
  return function (constructor, property, descriptor) {
    checkConstructorProperty(constructor, property);

    const metakey = constants.MARKERS_METADATA;
    const markerName = `${constructor.name}:${property}`;
    // ...
    const markers = Reflect.getOwnMetadata(metakey, constructor, property) || [];
    markers.push({ handler, constructor, descriptor, markerName });
    Reflect.defineMetadata(metakey, markers, constructor, property);
  };
}

exports.Marker = Marker;
// ...
function Sticker() {
  return function (constructor, property, descriptor) {
    if (typeof constructor !== "function") throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    const metakey = constants.IS_STICKER_METADATA;
    const stickerName = `${constructor.name}:${property}`;
    // ...
    Reflect.defineMetadata(metakey, stickerName, constructor, property);
  };
}

exports.Sticker = Sticker;
