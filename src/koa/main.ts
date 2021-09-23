// import { OpenApi } from "openapi";
import { join } from "path";
import { FwdContainer } from "./forwards";
import * as constants from "common/constants";
import { Promise } from "bluebird";
import { extractMiddlewares, extractParameterDecorators, safeJSON } from "./functions";
import {
  Constructor,
  HandlerFunction,
  ICursor,
  IEndpoint,
  IRouteElem,
  MiddlewareHandler,
} from "../common/declares";

/**
 * типовая middleware-функция, создаются WeakMap в контексте вызовов
 */
const $StateMap = (ctx, next) => {
  ctx.$StateMap = new WeakMap();
  return next();
};

/**
 * создание контекстной функции
 */
function makeCtx(cursor: ICursor, env: any = {}) {
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
        const status = Reflect.get(result, "status") || 500;
        ctx.status = status;
        ctx.body = { status, ...result };
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

function buildRoutesList(
  constructor: Constructor,
  prefix: string = "/",
  middlewares: MiddlewareHandler[] = []
): IRouteElem[] {
  const routesList = [];
  // список общих миддлварей, присущих маршрутному узлу
  const commonMiddlewares = extractMiddlewares({ constructor, property: undefined }, prefix);

  const routes: IEndpoint[] = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, constructor);

  if (routes) {
    routes.forEach((routeElem: IEndpoint) => {
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
      const endpointMiddlewares = extractMiddlewares(
        {
          constructor,
          property,
        },
        target.path
      );
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
      let { prefix: nextPrefix, nextRoute, property, descriptor } = bridgeData;

      // если мост является FwdContainer, то извлечем значение из выполнения функции
      if (nextRoute instanceof FwdContainer) {
        nextRoute = nextRoute.exec();
      }

      const newPrefix = join(prefix, nextPrefix);
      const bridgeMiddlewares = property
        ? extractMiddlewares({ constructor, property }, newPrefix)
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

export class $ {
  routes: IRouteElem[];

  constructor(root, prefix = "/") {
    this.routes = buildRoutesList(root, prefix);
  }

  eachRoute(handler: HandlerFunction) {
    this.routes.forEach((route: IRouteElem) => {
      Reflect.apply(handler, null, [route]);
    });
    return this;
  }
  // подключить документацию
  docs(docsContainer) {
    /*
    if (docsContainer instanceof OpenApi) {
      this.routes.forEach((route) => docsContainer.registerPath(route));
    } else {
      throw new Error(constants.OPENAPI_INSTANCE_ERROR);
    }
    */
    return this;
  }
}
