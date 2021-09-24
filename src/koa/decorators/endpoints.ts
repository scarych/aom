import * as constants from "common/constants";
import { restoreReverseMetadata, saveReverseMetadata } from "../functions";
import { checkConstructorProperty } from "common/functions";
import { Constructor, HandlerFunction, HTTPMethods, IEndpoint, Property } from "../../common/declares";

function bindEndpoint(constructor, { path, method, property, descriptor }: IEndpoint): void {
  const metakey = constants.ENDPOINTS_METADATA;
  // ...
  const endpoints = Reflect.getOwnMetadata(metakey, constructor) || [];
  endpoints.push({ path, method, property, descriptor });
  Reflect.defineMetadata(metakey, endpoints, constructor);
}

/**
 * определить endpoint: вернуть типичный
 */
function defineEndpoint(
  method: HTTPMethods,
  path: string,
  handler: HandlerFunction
): ReturnType<typeof Endpoint> | ClassDecorator {
  if (!handler) {
    return Endpoint(method, path);
  }

  return function (target: Constructor) {
    // ...
    const metakey = constants.LAZY_ENDPOINT;
    const descriptor = Reflect.getOwnMetadata(metakey, handler);
    if (descriptor) {
      const { constructor, property } = restoreReverseMetadata(handler);
      bindEndpoint(target, { constructor, property, path, method, descriptor });
    }
  };
}

/**
 *
 * @param method {HTTPMethods} метод endpoint-а
 * @param path {string} путь endpoint-а
 * @returns {MethodDecorator}
 */
export function Endpoint(method?: HTTPMethods, path?: string): MethodDecorator {
  return function (
    constructor: Constructor,
    property: Property,
    descriptor: PropertyDescriptor
  ): void {
    // ...
    checkConstructorProperty(constructor, property);

    // if use static method of class, then will store metadata for it with info about
    // origin class and propertyName, for futher usage
    saveReverseMetadata(constructor, property);

    // если установлены метод и путь, значит используем значение как стандартный endpoint
    if (method && path) {
      bindEndpoint(constructor, { constructor, path, method, property, descriptor });
    } else {
      const metakey = constants.LAZY_ENDPOINT;
      Reflect.defineMetadata(metakey, descriptor, constructor[property]);
    }
  };
}

// ************************************************ //
export function Get(path?: string): MethodDecorator;
export function Get(path: string, handler: HandlerFunction): ClassDecorator;

/**
 * определить endpoint с указанным адресом по методу `GET`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
export function Get(
  path: string = "/",
  handler?: HandlerFunction
): ReturnType<typeof defineEndpoint> {
  const method = "get";
  return defineEndpoint(method, path, handler);
}

// ************************************************ //
export function Post(path?: string): MethodDecorator;
export function Post(path: string, handler: HandlerFunction): ClassDecorator;

/**
 * определить endpoint с указанным адресом по методу `POST`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
export function Post(
  path: string = "/",
  handler?: HandlerFunction
): ReturnType<typeof defineEndpoint> {
  const method = "post";
  return defineEndpoint(method, path, handler);
}

// ************************************************ //
export function Patch(path?: string): MethodDecorator;
export function Patch(path: string, handler: HandlerFunction): ClassDecorator;

/**
 * определить endpoint с указанным адресом по методу `PATCH`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
export function Patch(
  path: string = "/",
  handler?: HandlerFunction
): ReturnType<typeof defineEndpoint> {
  const method = "patch";
  return defineEndpoint(method, path, handler);
}

// ************************************************ //
export function Put(path?: string): MethodDecorator;
export function Put(path: string, handler: HandlerFunction): ClassDecorator;
/**
 * определить endpoint с указанным адресом по методу `PUT`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
export function Put(
  path: string = "/",
  handler?: HandlerFunction
): ReturnType<typeof defineEndpoint> {
  const method = "put";
  return defineEndpoint(method, path, handler);
}

// ************************************************ //
export function Options(path?: string): MethodDecorator;
export function Options(path: string, handler: HandlerFunction): ClassDecorator;

/**
 * определить endpoint с указанным адресом по методу `OPTIONS`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
export function Options(
  path: string = "/",
  handler?: HandlerFunction
): ReturnType<typeof defineEndpoint> {
  const method = "options";
  return defineEndpoint(method, path, handler);
}

// ************************************************ //
export function Delete(path?: string): MethodDecorator;
export function Delete(path: string, handler: HandlerFunction): ClassDecorator;
/**
 * определить endpoint с указанным адресом по методу `DELETE`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
export function Delete(
  path: string = "/",
  handler?: HandlerFunction
): ReturnType<typeof defineEndpoint> {
  const method = "delete";
  return defineEndpoint(method, path, handler);
}

// ************************************************ //
export function All(path?: string): MethodDecorator;
export function All(path: string, handler: HandlerFunction): ClassDecorator;
/**
 * определить endpoint с указанным адресом по методу `ALL`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
export function All(
  path: string = "/",
  handler?: HandlerFunction
): ReturnType<typeof defineEndpoint> {
  const method = "all";
  return defineEndpoint(method, path, handler);
}
