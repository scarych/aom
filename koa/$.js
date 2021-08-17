"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { Promise } = require("bluebird");
const constants = require("../common/constants");
const { OpenApi } = require("../openapi");
const { join } = require("path");
const { restoreReverseMetadata } = require("../common/functions");

const $StateMap = (ctx, next) => {
  ctx.$StateMap = new WeakMap();
  return next();
};

// сгенерировать последовательность вызовов
async function nextSequences(handlers = [], defaultArguments = {}) {
  //
  let returnValue;
  while (!returnValue && handlers.length > 0) {
    const handler = handlers.shift();
    //
    const { constructor, property } = restoreReverseMetadata(handler) || {};
    if (constructor && property) {
      const decoratedArgs = extractParameterDecorators(constructor, property);

      // check sticker metadata
      const stickerData = Reflect.getOwnMetadata(
        constants.IS_STICKER_METADATA,
        constructor,
        property
      );
      const { target } = defaultArguments;

      if (stickerData && target.constructor.prototype instanceof constructor) {
        // change default cursor constuctor
        Object.assign(defaultArguments.cursor, {
          constructor: target.constructor,
          property,
        });
      } else {
        // restore cursor constructor and property
        Object.assign(defaultArguments.cursor, { constructor, property });
      }

      const args = await Promise.map(
        decoratedArgs,
        async (arg) => arg && (await Reflect.apply(arg, constructor, [defaultArguments]))
      );
      args.push(defaultArguments);
      // .concat([defaultArguments]);
      const result = await Reflect.apply(handler, constructor, args);

      if (result === defaultArguments.next) {
        continue;
      } else if (result instanceof Error) {
        throw result;
      } else {
        returnValue = result;
        break;
      }
    }
  }
  // return default next if  return value wasn't found
  return returnValue || defaultArguments.next;
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
      const middlewareMapData = restoreReverseMetadata(handler);
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
      const defaultArguments = { ...env, cursor, ctx, next };
      const args = await Promise.map(
        decoratedArgs,
        async (arg) => arg && (await Reflect.apply(arg, constructor, [defaultArguments]))
      );
      args.push(defaultArguments);
      //
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

  route - конечный элемент маршрута, endpoint с его окружением: path, method, handler, constructor, propertyKey, middlewares
  cursor - текущий элемент миддлвари, с префиксом, характеризующим участок его выполнения

  // seq - последовательность всех миддлварей, которые делались на каждом из этапов


}
При этом origin - фиксируется в начале,  prefix меняется на каждой итерации, 
current - контекстен в каждом конкретном месте, а target, path и method - элементы финального цикла
seq - 
*/

function safeJSON(data) {
  Object.assign(data, {
    toJSON() {
      const skipKeys = ["constructor", "handler", "property", "middlewares", "callstack"];
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
      // target - элемент маршрута, доступен через декораторы параметров `@Target`
      const target = safeJSON({
        method,
        path: routePath,
        constructor,
        property,
        handler,
      });

      // get middlewars for endpoint with correct prefix
      const endpointMiddlewares = extractMiddlewares({
        constructor,
        property,
        prefix: target.path,
      });
      // создадим курсоры, включив в них информацию и о последнем вызове в стеке
      const cursors = []
        .concat(middlewares, commonMiddlewares, endpointMiddlewares)
        .concat([{ constructor, property, handler, prefix: target.path }]);
      const env = { target };

      Object.assign(target, {
        // добавим информацию о всем стеке middleware, который предшествует данному методу
        cursors,
        // сгенерирем полный стек вызовов в контексте
        middlewares: [$StateMap].concat(cursors.map((cursor) => makeCtx(cursor, { ...env }))),
      });
      routesList.push(target);
    });
  }

  const bridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, constructor);

  if (bridges) {
    bridges.forEach((bridgeData) => {
      const { prefix: nextPrefix, nextRoute, property, descriptor } = bridgeData;
      const newPrefix = join(prefix, nextPrefix);
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

class $ {
  routes;
  constructor(root, prefix = "/") {
    this.routes = buildRoutesList(root, prefix);
  }

  eachRoute(handler) {
    this.routes.forEach((route) => {
      Reflect.apply(handler, null, [route]);
    });
    return this;
  }
  // подключить документацию
  docs(docsContainer) {
    if (docsContainer instanceof OpenApi) {
      this.routes.forEach((route) => docsContainer.registerPath(route));
    } else {
      throw new Error(constants.OPENAPI_INSTANCE_ERROR);
    }
    return this;
  }
}

exports.$ = $;

/*
function $(constructor, prefix = "/") {
  return (router) => {
    const routesList = buildRoutesList(constructor, prefix);
    routesList.forEach((routeData) => {
      const { method, path, generateCtx } = routeData;
      router[method](path, ...generateCtx(routesList));
    });
    return router;
  };
}

exports.$ = $;
*/
