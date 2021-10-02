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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9rb2EvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsK0JBQTRCO0FBQzVCLHlDQUEwQztBQUMxQywrREFBaUQ7QUFDakQsdUNBQW1DO0FBQ25DLDJDQUtxQjtBQVVyQix3Q0FBcUM7QUFLckMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7SUFDOUIsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO0lBQzlCLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFDaEIsQ0FBQyxDQUFDO0FBS0YsU0FBUyxPQUFPLENBQUMsTUFBZSxFQUFFLEtBQWE7SUFDN0MsTUFBTSxHQUFHLElBQUEsb0JBQVEsRUFBQyxNQUFNLENBQUMsQ0FBQztJQUMxQixNQUFNLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUM7SUFHbEQsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlGLElBQUksV0FBVyxFQUFFO1FBQ2YsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQzdCLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQ25FLENBQUM7S0FDSDtJQVlELE1BQU0sYUFBYSxHQUFHLElBQUEsc0NBQTBCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3hFLE9BQU8sS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUN6QixJQUFJO1lBS0YsTUFBTSxnQkFBZ0IsR0FBVSxFQUFFLEtB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