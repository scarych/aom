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
const path_1 = require("path");
const forwards_1 = require("./forwards");
const constants = __importStar(require("../common/constants"));
const bluebird_1 = require("bluebird");
const functions_1 = require("./functions");
const openapi_1 = require("../openapi");
const $StateMap = (ctx, next) => {
    ctx.$StateMap = new WeakMap();
    return next();
};
function makeCtx(cursor, route) {
    cursor = (0, functions_1.safeJSON)(cursor);
    const { constructor, property, handler } = cursor;
    const markersData = Reflect.getOwnMetadata(constants.MARKERS_METADATA, constructor, property);
    if (markersData) {
        markersData.forEach((marker) => Reflect.apply(marker.handler, marker.constructor, [route, cursor]));
    }
    const decoratedArgs = (0, functions_1.extractParameterDecorators)(constructor, property);
    return async (ctx, next) => {
        try {
            const defaultArguments = { route, cursor, ctx, next };
            const args = await bluebird_1.Promise.map(decoratedArgs, async (arg) => arg && (await Reflect.apply(arg, constructor, [defaultArguments])));
            args.push(defaultArguments);
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
function extractNextFunctions(origin, prefix) {
    const result = [];
    const { constructor, property } = origin;
    const handler = Reflect.getOwnMetadata(constants.USE_NEXT_METADATA, constructor, property);
    if (handler) {
        if (Reflect.getOwnMetadata(constants.IS_ENDPOINT, handler)) {
            const handlerConstructorProperty = (0, functions_1.restoreReverseMetadata)(handler);
            result.push({
                handler,
                ...handlerConstructorProperty,
                prefix,
                origin,
            });
            result.push(...extractNextFunctions(handlerConstructorProperty, prefix));
        }
        else {
            throw new Error(constants.USE_NEXT_ERROR);
        }
    }
    return result;
}
function buildRoutesList(constructor, prefix = "/", middlewares = []) {
    const routesList = [];
    const commonMiddlewares = (0, functions_1.extractMiddlewares)({ constructor, property: undefined }, prefix);
    const endpoints = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, constructor);
    if (endpoints) {
        endpoints.forEach((endpoint) => {
            const { method, path, handler } = endpoint;
            const handlerConstructorProperty = (0, functions_1.restoreReverseMetadata)(handler);
            const routePath = (0, path_1.join)(prefix, path).replace(/\/$/, "") || "/";
            const endpointMiddlewares = (0, functions_1.extractMiddlewares)({
                ...handlerConstructorProperty,
            }, routePath);
            const nextFunctions = extractNextFunctions(handlerConstructorProperty, routePath);
            const route = (0, functions_1.safeJSON)({
                method,
                path: routePath,
                ...handlerConstructorProperty,
                handler,
            });
            const cursors = []
                .concat(middlewares, commonMiddlewares, endpointMiddlewares)
                .concat([
                {
                    ...handlerConstructorProperty,
                    handler,
                    prefix: routePath,
                    origin: { ...handlerConstructorProperty, constructor },
                },
            ])
                .concat(nextFunctions)
                .map((cursor) => {
                if (cursor.origin.constructor.prototype instanceof cursor.constructor) {
                    Object.assign(cursor, { constructor: cursor.origin.constructor });
                }
                return cursor;
            });
            Object.assign(route, {
                cursors,
                middlewares: [$StateMap].concat(cursors.map((cursor) => makeCtx(cursor, route))),
            });
            routesList.push(route);
        });
    }
    const bridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, constructor);
    if (bridges) {
        bridges.forEach((bridgeData) => {
            let { prefix: nextPrefix, nextRoute, property, descriptor } = bridgeData;
            if (nextRoute instanceof forwards_1.FwdContainer) {
                nextRoute = nextRoute.exec();
            }
            const newPrefix = (0, path_1.join)(prefix, nextPrefix);
            const bridgeMiddlewares = property
                ? (0, functions_1.extractMiddlewares)({ constructor, property }, newPrefix)
                : [];
            if (descriptor && typeof descriptor.value === "function") {
                bridgeMiddlewares.push({
                    constructor,
                    property,
                    handler: descriptor.value,
                    prefix: newPrefix,
                    origin: { constructor, property },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9rb2EvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsK0JBQTRCO0FBQzVCLHlDQUEwQztBQUMxQywrREFBaUQ7QUFDakQsdUNBQW1DO0FBQ25DLDJDQUtxQjtBQVdyQix3Q0FBcUM7QUFLckMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDOUIsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0lBQzlCLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBS0YsU0FBUyxPQUFPLENBQUMsTUFBZSxFQUFFLEtBQWE7SUFDN0MsTUFBTSxHQUFHLElBQUEsb0JBQVEsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixNQUFNLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUM7SUFHbEQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlGLElBQUksV0FBVyxFQUFFO1FBQ2YsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQzdCLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQ25FLENBQUM7S0FDSDtJQVlELE1BQU0sYUFBYSxHQUFHLElBQUEsc0NBQTBCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hFLE9BQU8sS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN6QixJQUFJO1lBS0YsTUFBTSxnQkFBZ0IsR0FBVSxFQUFFLEtB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