"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const constants = require("./constants");
const { join } = require("path");

// сгенерировать последовательность вызовов
function nextSequences(handlers = [], defaultArguments = {}) {
  //
  let returnValue;
  handlers.forEach(async (handler) => {
    if (Reflect.getOwnMetadata(constants.IS_MIDDLEWARE_METADATA, handler)) {
      //
      const { constructor, property } = Reflect.getOwnMetadata(constants.REVERSE_METADATA, handler);
      const decoratedArgs = extractParameterDecorators(constructor, property);

      const args = decoratedArgs
        .map((arg) => arg && Reflect.apply(arg, constructor, defaultArguments))
        .concat(defaultArguments);
      const result = await Reflect.apply(handler, constructor, args);

      if (result === defaultArguments.next) {
        continue;
      } else if (result instanceof Error) {
        throw result;
      } else {
        returnValue = result;
        break;
      }
    } else {
      throw new Error(constants.IS_MIDDLEWARE_ERROR);
    }
    return returnValue
  });
}

exports.nextSequences = nextSequences;

function extractParameterDecorators(constructor, property) {
  const metadataKey = constants.PARAMETERS_METADATA;
  return Reflect.getOwnMetadata(metadataKey, constructor, property) || [];
}

function extractMiddlewares({ constructor, property = undefined, prefix }) {
  const resultMiddlewares = [];
  // ...
  const metadataKey = constants.MIDDLEWARE_METADATA;
  const propertyMiddlewares = Reflect.getOwnMetadata(metadataKey, constructor, property) || [];

  propertyMiddlewares.forEach((handler) => {
    if (Reflect.getOwnMetadata(constants.IS_MIDDLEWARE_METADATA, handler)) {
      //
      const middlewareMapData = Reflect.getOwnMetadata(constants.REVERSE_METADATA, handler);
      // try to found middlewares for current middlewares and set them before current
      // cyclic links checking onboard
      resultMiddlewares.push(...extractMiddlewares({ ...middlewareMapData, prefix }));
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
  const markersData = Reflect.getOwnMetadata(constants.MARKERS_METADATA, constructor, property);
  if (markersData) {
    markersData.forEach((marker) =>
      Reflect.apply(marker.handler, marker.constructor, [target, cursor])
    );
  }

  // в момент генерации вызова проверим, является ли данное свойство стикером
  const stickerData = Reflect.getOwnMetadata(constants.IS_STICKER_METADATA, constructor, property);
  // и если является, и целевой конструктор является наследником курсора
  if (stickerData && target.constructor.prototype instanceof cursor.constructor) {
    // то в курсоре заменим конструктор на целевой
    cursor.constructor = target.constructor;
  }

  const decoratedArgs = extractParameterDecorators(constructor, property);
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
  const commonMiddlewares = extractMiddlewares({ constructor, prefix });

  const routes = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, constructor);

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
      const propertyMiddlewares = extractMiddlewares({
        constructor,
        property,
        prefix: target.path,
      });
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

  const bridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, constructor);

  if (bridges) {
    bridges.forEach((bridgeData) => {
      const { url, nextRoute, property, descriptor } = bridgeData;
      const newPrefix = join(prefix, url);
      const bridgeMiddlewares = property
        ? extractMiddlewares({ constructor, property, prefix: newPrefix })
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

function $(constructor, prefix = "/") {
  return (router) => {
    const routesList = buildRoutesList(constructor, prefix);
    routesList.forEach((routeData) => {
      const { method, path, exec } = routeData;
      router[method](path, ...exec(routesList));
    });
    return router;
  };
}

exports.$ = $;
