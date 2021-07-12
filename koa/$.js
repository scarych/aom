"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const constants = require("./constants");
const { join } = require("path");

function extractParameterDecorators(target, propertyKey) {
  const metadataKey = constants.PARAMETERS_METADATA;
  return Reflect.getOwnMetadata(metadataKey, target, propertyKey) || [];
}

function extractMiddlewares(target, propertyKey = undefined, env = {}) {
  // ...
  const metadataKey = constants.MIDDLEWARE_METADATA;
  // console.log({ metadataKey, target, propertyKey, env });
  const propertyMiddlewares = Reflect.getOwnMetadata(metadataKey, target, propertyKey) || [];

  return propertyMiddlewares.map((middleware) => {
    if (Reflect.getOwnMetadata(constants.IS_MIDDLEWARE_METADATA, middleware)) {
      const middlewareMapData = Reflect.getOwnMetadata(constants.REVERSE_METADATA, middleware);
      return {
        handler: middleware,
        target: middlewareMapData.target,
        propertyKey: middlewareMapData.propertyKey,
        env,
      };
      /*
        return runCtx(
          middlewareMapData.target,
          middlewareMapData.propertyKey,
          middleware,
          rootData
        );
        */
    } else {
      throw new Error(constants.IS_MIDDLEWARE_ERROR);
    }
  });
  /*
    .concat((ctx, next) => {
      return next();
    });
    */
}

function runCtx({ target, propertyKey, handler }, env = {}) {
  //
  const decoratedArgs = extractParameterDecorators(target, propertyKey);
  return async (ctx, next) => {
    try {
      // а тут важно разобрать параметры из декстриптора, и извлечь
      // из контекста необходимые данные, либо обернуть контекст в унифицированный
      // извлекатель данных по декораторам аргументов
      // последними аргументами всегда будут ctx, next
      const defaultArguments = [{ ...env, ctx, next }];
      const args = decoratedArgs
        .map((arg) => arg && Reflect.apply(arg, target, defaultArguments))
        .concat(defaultArguments);
      const result = await Reflect.apply(handler, target, args);
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

  origin - исходный класс, откуда строится маршрут
  prefix - текущий префикс, участвующий в итерации

  current - текущий класс, которому принадлежит миддварь

  target - целевой класс, которому принадлежит ендпоинт
  path - целевой путь, который
  method - метод миддлвари, который сейчас реализуется

  seq - последовательность всех миддлварей, которые делались на каждом из этапов


}
При этом origin - фиксируется в начале,  prefix меняется на каждой итерации, 
current - контекстен в каждом конкретном месте, а target, path и method - элементы финального цикла
seq - 
*/
function buildRoutesList(target, prefix = "/", env = {}, middlewares = []) {
  let routesList = [];
  const bridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, target);
  const routes = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, target);

  const targetMiddlewares = extractMiddlewares(target, undefined, { prefix });

  if (routes) {
    routes.forEach((route) => {
      const { method, descriptor, path, propertyKey } = route;
      const routePath = join(prefix, path).replace(/\/$/, "") || "/"; // remove trailing slash
      const propertyMiddlewares = extractMiddlewares(target, propertyKey, {
        prefix: routePath,
      });
      const endpointEnv = { ...env, method, path: routePath, target };
      routesList.push({
        method,
        path: routePath, // if path is empty, set root value
        exec: []
          .concat(middlewares, targetMiddlewares, propertyMiddlewares)
          .map((middleware) =>
            runCtx(middleware, {
              current: middleware.target,
              ...middleware.env,
              ...endpointEnv,
            })
          )
          .concat(
            runCtx(
              { target, propertyKey, handler: descriptor.value },
              { current: target, ...endpointEnv }
            )
          ),
      });
    });
  }

  if (bridges) {
    bridges.forEach((bridgeData) => {
      const { url, nextRoute, propertyKey } = bridgeData;
      const newPrefix = join(prefix, url);
      const bridgeMiddlewares = propertyKey ? extractMiddlewares(target, propertyKey) : [];
      routesList.push(
        ...buildRoutesList(
          nextRoute,
          newPrefix,
          env,
          [].concat(middlewares, targetMiddlewares, bridgeMiddlewares)
        )
      );
    });
  }

  return routesList;
}

function $(origin, prefix = "/") {
  return (router) => {
    const routesList = buildRoutesList(origin, prefix, { origin });
    routesList.forEach((routeData) => {
      const { method, path, exec } = routeData;
      router[method](path, ...exec);
    });
    return router;
  };
}

exports.$ = $;
