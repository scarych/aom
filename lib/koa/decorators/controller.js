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
exports.Controller = void 0;
const constants = __importStar(require("../../common/constants"));
const functions_1 = require("../functions");
function cloneMetadataPlain(metadataKey, origin, constructor) {
    Reflect.defineMetadata(metadataKey, Reflect.getOwnMetadata(metadataKey, origin.constructor, origin.property), constructor, origin.property);
}
function cloneMetadataList(metadataKey, origin, constructor) {
    const originData = Reflect.getOwnMetadata(metadataKey, origin.constructor, origin.property) || [];
    Reflect.defineMetadata(metadataKey, originData.map((values) => ({ ...values, constructor })), constructor, origin.property);
}
function Controller() {
    return (constructor) => {
        const parentConstructor = Object.getPrototypeOf(constructor);
        const parentMiddlewares = Reflect.getOwnMetadata(constants.MIDDLEWARES_LIST_METADATA, parentConstructor) || [];
        parentMiddlewares.forEach((middleware) => {
            const { property, descriptor } = middleware;
            if (!Reflect.getOwnPropertyDescriptor(constructor, property)) {
                Reflect.defineProperty(constructor, property, {
                    value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                });
                (0, functions_1.saveReverseMetadata)(constructor, property);
                Reflect.defineMetadata(constants.IS_MIDDLEWARE_METADATA, true, constructor[property]);
                cloneMetadataPlain(constants.PARAMETERS_METADATA, middleware, constructor);
                cloneMetadataPlain(constants.OPEN_API_METADATA, middleware, constructor);
                cloneMetadataPlain(constants.MIDDLEWARE_METADATA, middleware, constructor);
                cloneMetadataList(constants.MARKERS_METADATA, middleware, constructor);
            }
            else {
                console.warn("property for middleware", { middleware }, "exists into", { constructor });
            }
        });
        const parentCommonEndpoints = Reflect.getOwnMetadata(constants.COMMON_ENDPOINTS_LIST, parentConstructor) || [];
        parentCommonEndpoints.forEach((endpoint) => {
            const { property, descriptor } = endpoint;
            if (!Reflect.getOwnPropertyDescriptor(constructor, property)) {
                Reflect.defineProperty(constructor, property, {
                    value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                });
                (0, functions_1.saveReverseMetadata)(constructor, property);
                Reflect.defineMetadata(constants.COMMON_ENDPOINT, descriptor, constructor[property]);
                cloneMetadataPlain(constants.PARAMETERS_METADATA, endpoint, constructor);
                cloneMetadataPlain(constants.OPEN_API_METADATA, endpoint, constructor);
                cloneMetadataPlain(constants.MIDDLEWARE_METADATA, endpoint, constructor);
            }
            else {
                console.warn("property for common endpoint", { endpoint }, "exists into", { constructor });
            }
        });
        const parentEndpoints = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, parentConstructor) || [];
        if (parentEndpoints.length > 0) {
            const endpoints = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, constructor) || [];
            const endpointsStruct = {
                byProperty: {},
                byPathMethod: {},
                add(endpoint) {
                    const { handler, path, method } = endpoint;
                    const { property } = (0, functions_1.restoreReverseMetadata)(handler);
                    this.byProperty[property] = true;
                    this.byPathMethod[`${path}:${method}`] = true;
                },
                checkExists(endpoint) {
                    const { handler, path, method } = endpoint;
                    const { property } = (0, functions_1.restoreReverseMetadata)(handler);
                    return this.byProperty[property] || this.byPathMethod[`${path}:${method}`];
                },
            };
            endpoints.forEach((endpoint) => endpointsStruct.add(endpoint));
            parentEndpoints.forEach((endpoint) => {
                const { descriptor, handler } = endpoint;
                const handlerConstructorProperty = (0, functions_1.restoreReverseMetadata)(handler);
                const { property } = handlerConstructorProperty;
                if (!endpointsStruct.checkExists(endpoint) &&
                    !Reflect.getOwnPropertyDescriptor(constructor, property)) {
                    Reflect.defineProperty(constructor, property, {
                        value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                    });
                    (0, functions_1.saveReverseMetadata)(constructor, property);
                    endpoints.push({ ...endpoint, handler: constructor[property] });
                    cloneMetadataPlain(constants.PARAMETERS_METADATA, handlerConstructorProperty, constructor);
                    cloneMetadataPlain(constants.OPEN_API_METADATA, handlerConstructorProperty, constructor);
                    cloneMetadataPlain(constants.MIDDLEWARE_METADATA, handlerConstructorProperty, constructor);
                }
                else {
                    console.warn("property or endpoint", { endpoint }, "exists into", { constructor });
                }
            });
            Reflect.defineMetadata(constants.ENDPOINTS_METADATA, endpoints, constructor);
        }
        const parentBridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, parentConstructor) || [];
        if (parentBridges.length > 0) {
            const bridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, constructor);
            const bridgesStruct = {
                byProperty: {},
                byPrefix: {},
                add(bridge) {
                    const { property, prefix } = bridge;
                    if (property) {
                        this.byProperty[property] = true;
                    }
                    this.byPrefix[prefix] = true;
                },
                checkExists(bridge) {
                    const { property, prefix } = bridge;
                    return this.byProperty[property] || this.byPrefix[prefix];
                },
            };
            bridges.forEach((bridge) => bridgesStruct.add(bridge));
            parentBridges.forEach((bridge) => {
                const { property, descriptor } = bridge;
                if (bridge.property &&
                    !bridgesStruct.checkExists(bridge) &&
                    !Reflect.getOwnPropertyDescriptor(constructor, property)) {
                    Reflect.defineProperty(constructor, property, {
                        value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                    });
                    bridges.push({ ...bridge, constructor });
                    cloneMetadataPlain(constants.PARAMETERS_METADATA, bridge, constructor);
                    cloneMetadataPlain(constants.OPEN_API_METADATA, bridge, constructor);
                    cloneMetadataPlain(constants.MIDDLEWARE_METADATA, bridge, constructor);
                }
                else if (!bridge.property && !bridgesStruct.checkExists(bridge)) {
                    bridges.push({ ...bridge, constructor });
                    cloneMetadataPlain(constants.MIDDLEWARE_METADATA, { ...bridge, property: undefined }, constructor);
                }
                else {
                    console.warn("bridge or property", { bridge }, "exists into", { constructor });
                }
            });
            Reflect.defineMetadata(constants.BRIDGE_METADATA, bridges, constructor);
        }
        const openApiTag = Reflect.getOwnMetadata(constants.OPENAPI_TAG, parentConstructor);
        if (openApiTag && !Reflect.getOwnMetadata(constants.OPENAPI_TAG, constructor)) {
            Reflect.defineMetadata(constants.OPENAPI_TAG, openApiTag, constructor);
        }
        const openApiSecurity = Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, parentConstructor);
        if (openApiSecurity && !Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, constructor)) {
            Reflect.defineMetadata(constants.OPENAPI_SECURITY, openApiSecurity, constructor);
        }
    };
}
exports.Controller = Controller;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFRcEQsNENBQTJFO0FBRzNFLFNBQVMsa0JBQWtCLENBQ3pCLFdBQW1CLEVBQ25CLE1BQVMsRUFDVCxXQUF3QjtJQUV4QixPQUFPLENBQUMsY0FBYyxDQUNwQixXQUFXLEVBQ1gsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQ3hFLFdBQVcsRUFDWCxNQUFNLENBQUMsUUFBUSxDQUNoQixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQ3hCLFdBQW1CLEVBQ25CLE1BQVMsRUFDVCxXQUF3QjtJQUV4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbEcsT0FBTyxDQUFDLGNBQWMsQ0FDcEIsV0FBVyxFQUNYLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQ3hELFdBQVcsRUFDWCxNQUFNLENBQUMsUUFBUSxDQUNoQixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQWdCLFVBQVU7SUFDeEIsT0FBTyxDQUFDLFdBQVcsRUFBUSxFQUFFO1FBRzNCLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUc3RCxNQUFNLGlCQUFpQixHQUNyQixPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyx5QkFBeUIsRUFBRSxpQkFB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