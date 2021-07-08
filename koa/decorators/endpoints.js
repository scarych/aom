"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Endpoint = void 0;
const constants = require("../constants");
function Endpoint(path = "/", method = "get") {
  return function (target, propertyKey, descriptor) {
    const metakey = constants.ENDPOINTS_METADATA;
    // ...
    const endpoints = Reflect.getOwnMetadata(metakey, target) || [];
    endpoints.push({ path, method, propertyKey, descriptor });
    Reflect.defineMetadata(metakey, endpoints, target);
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
