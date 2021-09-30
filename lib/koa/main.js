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
    const { constructor, property /*handler */ } = cursor;
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
            // const result = await Reflect.apply(handler, constructor, args);
            const result = await Reflect.apply(constructor[property], constructor, args);
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
            const { method, path, constructor, property } = endpoint;
            // const { constructor, property } = restoreReverseMetadata(handler);
            // const handler = descriptor.value;
            // remove trailing slash and set root if empty
            const routePath = (0, path_1.join)(prefix, path).replace(/\/$/, "") || "/";
            // target - элемент маршрута, доступен через декораторы параметров `@Target`
            const route = (0, functions_1.safeJSON)({
                method,
                path: routePath,
                constructor,
                property,
                // handler,
            });
            // get middlewars for endpoint with correct prefix
            const endpointMiddlewares = (0, functions_1.extractMiddlewares)({
                constructor,
                property,
            }, routePath);
            // создадим курсоры, включив в них информацию и о последнем вызове в стеке
            const cursors = []
                .concat(middlewares, commonMiddlewares, endpointMiddlewares)
                .concat([{ constructor, property, /*handler,*/ prefix: routePath }]);
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
                    // handler: descriptor.value,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9rb2EvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEscUNBQXFDO0FBQ3JDLCtCQUE0QjtBQUM1Qix5Q0FBMEM7QUFDMUMsK0RBQWlEO0FBQ2pELHVDQUFtQztBQUNuQywyQ0FLcUI7QUFVckIsd0NBQXFDO0FBRXJDOztHQUVHO0FBQ0gsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDOUIsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0lBQzlCLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFTLE9BQU8sQ0FBQyxNQUFlLEVBQUUsS0FBYTtJQUM3QyxNQUFNLEdBQUcsSUFBQSxvQkFBUSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLE1BQU0sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLE1BQU0sQ0FBQztJQUN0RCwwR0FBMEc7SUFDMUcsMEJBQTBCO0lBQzFCLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUM5RixJQUFJLFdBQVcsRUFBRTtRQUNmLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUM3QixPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUNuRSxDQUFDO0tBQ0g7SUFFRDs7Ozs7Ozs7TUFRRTtJQUVGLE1BQU0sYUFBYSxHQUFHLElBQUEsc0NBQTBCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hFLE9B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