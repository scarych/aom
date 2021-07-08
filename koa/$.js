"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// exports.Bridge = void 0;
const constants = require("./constants");

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
      const middlewareMapData = Reflect.getOwnMetadata(
        constants.STATICS_REVERSE_METADATA,
        middleware
      );
      return runCtx(middlewareMapData.target, middlewareMapData.propertyKey, middleware);
    })
    .concat((ctx, next) => {
      // console.log(Date.now(), "run default middleware", target, propertyKey);
      return next();
    });
}

function runCtx(target, propertyKey, handler) {
  //
  const decoratedArgs = extractParameterDecorators(target, propertyKey);
  return async (ctx, next) => {
    // console.log(Date.now(), "run middleware", handler, target, propertyKey);

    try {
      // а тут важно разобрать параметры из декстриптора, и извлечь
      // из контекста необходимые данные, либо обернуть контекст в унифицированный
      // извлекатель данных по декораторам аргументов
      // последними аргументами всегда будут ctx, next
      const args = decoratedArgs
        .map((arg) => arg && Reflect.apply(arg, ctx, [ctx, next]))
        .concat([ctx, next]);
      const result = await Reflect.apply(handler, target, args);
      // console.log({ result, args });
      if (result === next) {
        return next();
      } else if (result instanceof Error) {
        ctx.status = Reflect.get(result, "status");
        ctx.body = Reflect.get(result, "message");
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

function $(target) {
  // const classOrigin = classObject.constructor;

  // .. do extract routes
  // const target = source.constructor;
  const targetRoutes = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, target);
  const targetBridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, target);
  // console.log("extract routes", source, target, targetRoutes, targetBridges);
  const targetMiddlewares = extractMiddlewares(target);

  return (router) => {
    // /*
    router.bridge("/", targetMiddlewares, (router) => {
      if (targetRoutes) {
        Object.keys(targetRoutes).forEach((propertyKey) => {
          const { method, descriptor, url } = targetRoutes[propertyKey];
          // console.log({ name, method, url });
          // const [method, url] = methodUrl.split(".");
          // ...
          // создадим в роутере по указанному методу и ссылке вызов на конкретный метод класса
          // при этом здесь следует все же добавить возможность собирать цепочки middleware
          // для данного descriptor+target
          const propertyMiddlewares = extractMiddlewares(target, propertyKey);
          // console.log({ ident });
          router[method](
            url,
            ...propertyMiddlewares,
            this.runCtx(target, propertyKey, descriptor.value)
          );
        });
      }
      // /*
      if (targetBridges) {
        targetBridges.forEach((bridgeData) => {
          const { url, nextRoute, propertyKey } = bridgeData;

          const bridgeMiddlewares = extractMiddlewares(target, propertyKey);

          // ...
          const nextBridge = this.extract(new nextRoute(source));
          router.bridge(url, bridgeMiddlewares, nextBridge);
        });
        // */
      }
    });
  };
}

exports.$ = $;
