"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = void 0;
// import { OpenApi } from "openapi";
const path_1 = require("path");
const forwards_1 = require("./forwards");
const constants = __importStar(require("../common/constants"));
const bluebird_1 = require("bluebird");
const functions_1 = require("./functions");
const openapi_1 = require("../openapi");
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
function makeCtx(cursor, route) {
    cursor = (0, functions_1.safeJSON)(cursor);
    const { constructor, property, handler } = cursor;
    // в момент генерации контекстного вызова извлечем маршрут, который есть всегда, и применим к нему маркеры
    // const { target } = env;
    const markersData = Reflect.getOwnMetadata(constants.MARKERS_METADATA, constructor, property);
    if (markersData) {
        markersData.forEach((marker) => Reflect.apply(marker.handler, marker.constructor, [route, cursor]));
    }
    /*
    // в момент генерации вызова проверим, является ли данное свойство стикером
    const stickerData = Reflect.getOwnMetadata(constants.IS_STICKER_METADATA, constructor, property);
    // и если является, и целевой конструктор является наследником курсора
    if (stickerData && route.constructor.prototype instanceof cursor.constructor) {
      // то в курсоре заменим конструктор на целевой
      cursor.constructor = route.constructor;
    }
    */
    const decoratedArgs = (0, functions_1.extractParameterDecorators)(constructor, property);
    return async (ctx, next) => {
        try {
            // а тут важно разобрать параметры из декстриптора, и извлечь
            // из контекста необходимые данные, либо обернуть контекст в унифицированный
            // извлекатель данных по декораторам аргументов
            // последними аргументами всегда будут ctx, next
            const defaultArguments = { route, cursor, ctx, next };
            const args = await bluebird_1.Promise.map(decoratedArgs, async (arg) => arg && (await Reflect.apply(arg, constructor, [defaultArguments])));
            args.push(defaultArguments);
            //
            const result = await Reflect.apply(handler, constructor, args);
            if (result === next) {
                return next();
            }
            else if (result instanceof Error) {
                const status = Reflect.get(result, "status") || 500;
                ctx.status = status;
                ctx.body = Object.assign(result, { status });
            }
            else {
                ctx.body = result;
            }
        }
        catch (e) {
            ctx.status = e.status || 500;
            ctx.body = e;
        }
        return ctx.body;
    };
}
function buildRoutesList(constructor, prefix = "/", middlewares = []) {
    const routesList = [];
    // список общих миддлварей, присущих маршрутному узлу
    const commonMiddlewares = (0, functions_1.extractMiddlewares)({ constructor, property: undefined }, prefix);
    const endpoints = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, constructor);
    if (endpoints) {
        endpoints.forEach((endpoint) => {
            // тут важный момент - заменяется значение constructor, и извлекается из
            // метаданных endpoint-а
            // в общем случае он равен текущему конструктору, но в случае lazy endpoint-ов
            // он будет равен конструктору самого endpoint-а
            const { method, path, handler } = endpoint;
            const { constructor, property } = (0, functions_1.restoreReverseMetadata)(handler);
            // const handler = descriptor.value;
            // remove trailing slash and set root if empty
            const routePath = (0, path_1.join)(prefix, path).replace(/\/$/, "") || "/";
            // target - элемент маршрута, доступен через декораторы параметров `@Target`
            const route = (0, functions_1.safeJSON)({
                method,
                path: routePath,
                constructor,
                property,
                handler,
            });
            // get middlewars for endpoint with correct prefix
            const endpointMiddlewares = (0, functions_1.extractMiddlewares)({
                constructor,
                property,
            }, routePath);
            // создадим курсоры, включив в них информацию и о последнем вызове в стеке
            const cursors = []
                .concat(middlewares, commonMiddlewares, endpointMiddlewares)
                .concat([{ constructor, property, handler, prefix: routePath }]);
            Object.assign(route, {
                // добавим информацию о всем стеке middleware, который предшествует данному методу
                cursors,
                // сгенерирем полный стек вызовов в контексте
                middlewares: [$StateMap].concat(cursors.map((cursor) => makeCtx(cursor, route))),
            });
            routesList.push(route);
        });
    }
    const bridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, constructor);
    if (bridges) {
        bridges.forEach((bridgeData) => {
            let { prefix: nextPrefix, nextRoute, property, descriptor } = bridgeData;
            // если мост является FwdContainer, то извлечем значение из выполнения функции
            if (nextRoute instanceof forwards_1.FwdContainer) {
                nextRoute = nextRoute.exec();
            }
            const newPrefix = (0, path_1.join)(prefix, nextPrefix);
            const bridgeMiddlewares = property
                ? (0, functions_1.extractMiddlewares)({ constructor, property }, newPrefix)
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
            routesList.push(...buildRoutesList(nextRoute, newPrefix, [].concat(middlewares, commonMiddlewares, bridgeMiddlewares)));
        });
    }
    return routesList;
}
class $ {
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
        if (docsContainer instanceof openapi_1.OpenApi) {
            this.routes.forEach((route) => docsContainer.registerPath(route));
        }
        else {
            throw new Error(constants.OPENAPI_INSTANCE_ERROR);
        }
        return this;
    }
}
exports.$ = $;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9rb2EvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQXFDO0FBQ3JDLCtCQUE0QjtBQUM1Qix5Q0FBMEM7QUFDMUMsK0RBQWlEO0FBQ2pELHVDQUFtQztBQUNuQywyQ0FLcUI7QUFVckIsd0NBQXFDO0FBRXJDOztHQUVHO0FBQ0gsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDOUIsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0lBQzlCLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFTLE9BQU8sQ0FBQyxNQUFlLEVBQUUsS0FBYTtJQUM3QyxNQUFNLEdBQUcsSUFBQSxvQkFBUSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLE1BQU0sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxHQUFHLE1BQU0sQ0FBQztJQUNsRCwwR0FBMEc7SUFDMUcsMEJBQTBCO0lBQzFCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RixJQUFJLFdBQVcsRUFBRTtRQUNmLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUNuRSxDQUFDO0tBQ0g7SUFFRDs7Ozs7Ozs7TUFRRTtJQUVGLE1BQU0sYUFBYSxHQUFHLElBQUEsc0NBQTBCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hFLE9B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