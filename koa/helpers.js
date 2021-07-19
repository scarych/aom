"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants = require("./constants");
const { join } = require("path");

function extractParameterDecorators(handler) {
  const metadataKey = constants.PARAMETERS_METADATA;
  return Reflect.getMetadata(metadataKey, handler) || [];
}

function extractMiddlewares(handler, prefix) {
  const resultMiddlewares = [];
  // ...
  const metadataKey = constants.MIDDLEWARE_METADATA;
  const propertyMiddlewares = Reflect.getMetadata(metadataKey, handler) || [];

  propertyMiddlewares.forEach((handler) => {
    if (Reflect.getMetadata(constants.IS_MIDDLEWARE_METADATA, handler)) {
      //
      const middlewareMapData = Reflect.getMetadata(constants.REVERSE_METADATA, handler);
      /*
      console.log("mw data", { middlewareMapData, handler }, "orig", {
        constructor,
        property,
      });
      // */
      // try to found middlewares for current middlewares and set them before current
      // cyclic links checking onboard
      resultMiddlewares.push(...extractMiddlewares(handler, prefix));
      resultMiddlewares.push({
        ...middlewareMapData,
        handler,
        prefix,
      });
    } else {
      throw new Error(constants.IS_MIDDLEWARE_ERROR);
    }
  });

  return resultMiddlewares;
}

function makeCtx(cursor, env = {}) {
  cursor = safeJSON(cursor);
  const { constructor, property, handler } = cursor;
  // в момент генерации контекстного вызова извлечем маршрут, который есть всегда, и применим к нему маркеры
  const { target } = env;
  const markersData = Reflect.getMetadata(constants.MARKERS_METADATA, constructor, property);
  if (markersData) {
    markersData.forEach((marker) =>
      Reflect.apply(marker.handler, marker.constructor, [target, cursor])
    );
  }

  const decoratedArgs = extractParameterDecorators(constructor[property]);
  return async (ctx, next) => {
    try {
      // а тут важно разобрать параметры из декстриптора, и извлечь
      // из контекста необходимые данные, либо обернуть контекст в унифицированный
      // извлекатель данных по декораторам аргументов
      // последними аргументами всегда будут ctx, next
      const defaultArguments = [{ ...env, cursor, ctx, next }];
      const args = decoratedArgs
        .map((arg) => arg && Reflect.apply(arg, constructor, defaultArguments))
        .concat(defaultArguments);
      const result = await Reflect.apply(handler, constructor, args);
      if (result === next) {
        return next();
      } else if (result instanceof Error) {
        ctx.status = Reflect.get(result, "status") || result.status || 500;
        ctx.body = result;
      } else {
        ctx.body = result;
      }
    } catch (e) {
      ctx.status = e.status || 500;
      ctx.body = e;
    }
    return ctx.body;
  };
}

/* как следует переделать методологию построения маршрутов 

в первую очередь, необходимо определиться, что будет включаться в аргументацию контекста
для построения аргументов необходимо, чтобы участвовали следующие значения

{
  ctx, next - базовые контексты koa

  route - конечный элемент маршрута, endpoint с его окружением: path, method, handler, constructor, propertyKey, callstack
  cursor - текущий элемент миддлвари, с префиксом, характеризующим участок его выполнения

  // seq - последовательность всех миддлварей, которые делались на каждом из этапов
  callstack - цепочка всех миддлварей в данном ендпоинте


}
При этом origin - фиксируется в начале,  prefix меняется на каждой итерации, 
current - контекстен в каждом конкретном месте, а target, path и method - элементы финального цикла
seq - 
*/

function safeJSON(data) {
  Object.assign(data, {
    toJSON() {
      const skipKeys = ["constructor", "handler", "property"];
      const safeEntries = Object.entries(data).filter(([key]) => skipKeys.indexOf(key) < 0);
      return Object.fromEntries(safeEntries);
    },
  });
  return data;
}

function buildRoutesList(constructor, prefix = "/", middlewares = []) {
  const routesList = [];
  const commonMiddlewares = extractMiddlewares(constructor, prefix);

  const routes = Reflect.getMetadata(constants.ENDPOINTS_METADATA, constructor);

  if (routes) {
    routes.forEach((routeElem) => {
      const { method, descriptor, path, property } = routeElem;
      const handler = descriptor.value;
      // remove trailing slash and set root if empty
      const routePath = join(prefix, path).replace(/\/$/, "") || "/";
      // route - элемент маршрута, доступен через декораторы параметров `@Route`
      const target = safeJSON({
        method,
        path: routePath,
        constructor,
        property,
        handler,
      });

      // get middlewars for endpoint with correct prefix
      const propertyMiddlewares = extractMiddlewares(constructor[property], target.path);
      const callstack = [].concat(middlewares, commonMiddlewares, propertyMiddlewares);
      const env = { target };
      Object.assign(target, {
        exec: (routes) =>
          callstack
            .map((middleware) =>
              makeCtx(middleware, {
                ...env,
                routes,
              })
            )
            .concat(
              makeCtx({ constructor, property, handler, prefix: target.path }, { ...env, routes })
            ),
      });
      routesList.push(target);
    });
  }

  const bridges = Reflect.getMetadata(constants.BRIDGE_METADATA, constructor);

  if (bridges) {
    bridges.forEach((bridgeData) => {
      const { url, nextRoute, property, descriptor } = bridgeData;
      const newPrefix = join(prefix, url);
      const bridgeMiddlewares = property
        ? extractMiddlewares(constructor[property], newPrefix)
        : [];
      // если мост является собственной миддлварбю
      if (descriptor && typeof descriptor.value === "function") {
        bridgeMiddlewares.push({
          constructor,
          property,
          handler: descriptor.value,
          prefix: newPrefix,
        });
      }
      routesList.push(
        ...buildRoutesList(
          nextRoute,
          newPrefix,
          [].concat(middlewares, commonMiddlewares, bridgeMiddlewares)
        )
      );
    });
  }

  return routesList;
}

exports.buildRoutesList = buildRoutesList;

function saveStorageMetadata(
  constructor,
  metakey,
  metadata,
  storageKey,
  push = false,
  pushIndex = undefined
) {
  // ...
  const storageMetaKey = constants.STORAGE_METADATA;
  // в хранилище находится WeakMap, ключами которого являются метаключи (из значений constants)
  const storage = Reflect.getMetadata(storageMetaKey, constructor) || new Map();
  // сохраним уникальный список ключей, которые используются в данном хранилище
  const storageSet = storage.get(constants.STORAGE_SET_METADATA) || new Set();
  storageSet.add(metakey);
  storage.set(constants.STORAGE_SET_METADATA, storageSet);

  // а значениями хранилища являются WeakMap-ы
  const metakeyData = storage.get(metakey) || new Map();
  // обязательно введем список всех хранящихся в хранищище ключей, чтобы затем можно
  // было по ним пройтись
  const metakeySet = metakeyData.get(constants.STORAGE_KEYS_SET_METADATA) || new Set();
  metakeySet.add(storageKey);
  metakeyData.set(constants.STORAGE_KEYS_SET_METADATA, metakeySet);

  // если подразумевается накопление значений, то поместим их в список
  if (push) {
    const arrayData = metakeyData.get(storageKey) || [];
    // если на вход подается массив, то он всегда объединяется с имеющимся
    if (metadata instanceof Array) {
      arrayData.push(...metadata);
    } else if (typeof pushIndex === "number") {
      arrayData[pushIndex] = metadata;
    } else {
      arrayData.push(metadata);
    }
    metakeyData.set(storageKey, arrayData);
  } else {
    // иначе просто присвоим значение
    metakeyData.set(storageKey, metadata);
  }
  // в хранилище сохраним метаданные
  storage.set(metakey, metakeyData);
  // в конструкторе сохраним хранилище
  Reflect.defineMetadata(storageMetaKey, storage, constructor);
}

exports.saveStorageMetadata = saveStorageMetadata;
