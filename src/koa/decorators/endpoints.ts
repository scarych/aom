import * as constants from "../../common/constants";
import { restoreReverseMetadata, saveReverseMetadata } from "../functions";
import { checkConstructorProperty } from "../../common/functions";
import {
  Constructor,
  HandlerFunction,
  HTTPMethods,
  IEndpoint,
  Property,
} from "../../common/declares";

function bindEndpoint(constructor, endpoint: IEndpoint): void {
  const metakey = constants.ENDPOINTS_METADATA;
  // ...
  const endpoints = Reflect.getOwnMetadata(metakey, constructor) || [];
  endpoints.push(endpoint);
  Reflect.defineMetadata(metakey, endpoints, constructor);
}

/**
 * определить endpoint: вернуть типичный Endpoint по методу, или подключить
 * отложенный endpoint
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
    // проверим, что данный handler - это lazy endpoint

    const { COMMON_ENDPOINT } = constants;
    // если это общий ендпоинт
    if (Reflect.getOwnMetadata(COMMON_ENDPOINT, handler)) {
      const { IS_ENDPOINT } = constants;
      const { descriptor, constructor, property } = Reflect.getOwnMetadata(IS_ENDPOINT, handler);
      bindEndpoint(target, {
        descriptor,
        path,
        method,
        handler,
        origin: { constructor, property },
      });
    } else {
      throw new Error(constants.COMMON_ENDPOINT_ERROR);
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
    const { IS_ENDPOINT, IS_ENDPOINTS_LIST } = constants;

    Reflect.defineMetadata(IS_ENDPOINT, descriptor, constructor[property]);

    // сохраним элемент в списке общих ендпоинтов
    const endpointsList = Reflect.getOwnMetadata(IS_ENDPOINTS_LIST, constructor) || [];
    endpointsList.push({ constructor, property, descriptor });
    Reflect.defineMetadata(IS_ENDPOINTS_LIST, endpointsList, constructor);

    // если установлены метод и путь, значит используем значение как стандартный endpoint
    if (method) {
      if (!path) path = "/"; // путь по умолчанию, если определен метод
      bindEndpoint(constructor, {
        descriptor,
        path,
        method,
        handler: constructor[property],
        origin: { constructor, property },
      });
    } else {
      const { COMMON_ENDPOINT } = constants;
      Reflect.defineMetadata(COMMON_ENDPOINT, true, constructor[property]);
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
