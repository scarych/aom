"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const constants = require("./constants");
const { join } = require("path");

function extractParameterDecorators(target, propertyKey) {
  const metadataKey = constants.PARAMETERS_METADATA;
  return Reflect.getOwnMetadata(metadataKey, target, propertyKey) || [];
}

function extractMiddlewares(target, propertyKey = undefined) {
  // ...
  const metadataKey = constants.MIDDLEWARE_METADATA;
  const propertyMiddlewares = Reflect.getOwnMetadata(metadataKey, target, propertyKey) || [];

  return propertyMiddlewares
    .map((middleware) => {
      if (Reflect.get(constants.IS_MIDDLEWARE_METADATA, middleware)) {
        const middlewareMapData = Reflect.getOwnMetadata(constants.REVERSE_METADATA, middleware);
        return runCtx(middlewareMapData.target, middlewareMapData.propertyKey, middleware, target);
      } else {
        throw new Error(constants.IS_MIDDLEWARE_ERROR);
      }
    })
    .concat((ctx, next) => {
      return next();
    });
}

function runCtx(target, propertyKey, handler, originTarget) {
  //
  const decoratedArgs = extractParameterDecorators(target, propertyKey);
  return async (ctx, next) => {
    try {
      // а тут важно разобрать параметры из декстриптора, и извлечь
      // из контекста необходимые данные, либо обернуть контекст в унифицированный
      // извлекатель данных по декораторам аргументов
      // последними аргументами всегда будут ctx, next
      const defaultArguments = [ctx, next, originTarget];
      const args = decoratedArgs
        .map(async (arg) => arg && (await Reflect.apply(arg, target, defaultArguments)))
        .concat(defaultArguments);
      const result = await Reflect.apply(handler, target, args);
      if (result === next) {
        return next();
      } else if (result instanceof Error) {
        ctx.status = Reflect.get(result, "status") || result.status || 500;
        ctx.body = Reflect.get(result, "message") || result.message;
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

function buildRoutesList(target, prefix = "/", middlewares = []) {
  let routes = [];
  const targetBridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, target);
  const targetRoutes = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, target);

  const targetMiddlewares = extractMiddlewares(target);

  if (targetRoutes) {
    targetRoutes.forEach((route) => {
      const { method, descriptor, path, propertyKey } = route;
      const propertyMiddlewares = extractMiddlewares(target, propertyKey);
      const routePath = join(prefix, path).replace(/\/$/, ""); // remove trailing slash
      routes.push({
        method,
        path: routePath || "/", // if path is empty, set root value
        exec: []
          .concat(middlewares, targetMiddlewares, propertyMiddlewares)
          .concat(runCtx(target, propertyKey, descriptor.value, target)),
      });
    });
  }

  if (targetBridges) {
    targetBridges.forEach((bridgeData) => {
      const { url, nextRoute, propertyKey } = bridgeData;
      const bridgeMiddlewares = extractMiddlewares(target, propertyKey);
      routes = routes.concat(
        buildRoutesList(
          nextRoute,
          join(prefix, url),
          [].concat(middlewares, targetMiddlewares, bridgeMiddlewares)
        )
      );
    });
  }

  return routes;
}

function $(target, prefix = "/") {
  return (router) => {
    buildRoutesList(target, prefix).forEach((routeData) => {
      const { method, path, exec } = routeData;
      router[method](path, ...exec);
    });
    return router;
  };
}

exports.$ = $;
