"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Endpoint = void 0;
const constants = require("../../common/constants");
const { checkConstructorProperty, reverseMetadata } = require("../../common/functions");

function Endpoint(path = "/", method = "get") {
  return function (constructor, property, descriptor) {
    checkConstructorProperty(constructor, property);

    // if use static method of class, then will store metadata for it with info about
    // origin class and propertyName, for futher usage
    reverseMetadata(constructor, property)

    const metakey = constants.ENDPOINTS_METADATA;
    // ...
    const endpoints = Reflect.getOwnMetadata(metakey, constructor) || [];
    endpoints.push({ path, method, property, descriptor });
    Reflect.defineMetadata(metakey, endpoints, constructor);
  };
}

exports.Endpoint = Endpoint;
// ---
function Get(path = "/") {
  return Endpoint(path, "get");
}

exports.Get = Get;
// ---
function Put(path = "/") {
  return Endpoint(path, "put");
}

exports.Put = Put;
// ---
function Post(path = "/") {
  return Endpoint(path, "post");
}

exports.Post = Post;
// ---
function Patch(path = "/") {
  return Endpoint(path, "patch");
}
exports.Patch = Patch;
// ---
function Options(path = "/") {
  return Endpoint(path, "options");
}
exports.Options = Options;
// ---
function Delete(path = "/") {
  return Endpoint(path, "delete");
}
exports.Delete = Delete;
