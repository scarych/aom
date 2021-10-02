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
                const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
                const middlewaresList = Reflect.getOwnMetadata(listMetakey, constructor) || [];
                middlewaresList.push({ constructor, property, descriptor });
                Reflect.defineMetadata(listMetakey, middlewaresList, constructor);
                cloneMetadataPlain(constants.PARAMETERS_METADATA, middleware, constructor);
                cloneMetadataPlain(constants.OPEN_API_METADATA, middleware, constructor);
                cloneMetadataPlain(constants.MIDDLEWARE_METADATA, middleware, constructor);
                cloneMetadataList(constants.MARKERS_METADATA, middleware, constructor);
            }
            else {
                console.warn("property for middleware", { middleware }, "exists into", { constructor });
            }
        });
        const { IS_ENDPOINTS_LIST } = constants;
        const parentIsEndpoints = Reflect.getOwnMetadata(IS_ENDPOINTS_LIST, parentConstructor) || [];
        if (parentIsEndpoints.length > 0) {
            const isEndpointsList = Reflect.getOwnMetadata(IS_ENDPOINTS_LIST, constructor) || [];
            parentIsEndpoints.forEach((endpoint) => {
                const { property, descriptor } = endpoint;
                if (!Reflect.getOwnPropertyDescriptor(constructor, property)) {
                    Reflect.defineProperty(constructor, property, {
                        value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                    });
                    (0, functions_1.saveReverseMetadata)(constructor, property);
                    Reflect.defineMetadata(constants.IS_ENDPOINT, descriptor, constructor[property]);
                    isEndpointsList.push({ constructor, property, descriptor });
                    const { COMMON_ENDPOINT } = constants;
                    if (Reflect.getOwnMetadata(COMMON_ENDPOINT, endpoint.constructor[property])) {
                        Reflect.defineMetadata(COMMON_ENDPOINT, true, constructor[property]);
                    }
                    cloneMetadataPlain(constants.PARAMETERS_METADATA, endpoint, constructor);
                    cloneMetadataPlain(constants.OPEN_API_METADATA, endpoint, constructor);
                    cloneMetadataPlain(constants.MIDDLEWARE_METADATA, endpoint, constructor);
                }
                else {
                    console.warn("property for endpoint", { endpoint }, "exists into", { constructor });
                }
            });
            Reflect.defineMetadata(IS_ENDPOINTS_LIST, isEndpointsList, constructor);
        }
        const { ENDPOINTS_METADATA } = constants;
        const parentEndpoints = Reflect.getOwnMetadata(ENDPOINTS_METADATA, parentConstructor) || [];
        if (parentEndpoints.length > 0) {
            const endpoints = Reflect.getOwnMetadata(ENDPOINTS_METADATA, constructor) || [];
            const endpointsStruct = {
                byProperty: {},
                byPathMethod: {},
                add(endpoint) {
                    const { path, method } = endpoint;
                    this.byPathMethod[`${path}:${method}`] = true;
                },
                checkExists(endpoint) {
                    const { path, method } = endpoint;
                    return this.byPathMethod[`${path}:${method}`];
                },
            };
            endpoints.forEach((endpoint) => endpointsStruct.add(endpoint));
            parentEndpoints.forEach((endpoint) => {
                const { handler } = endpoint;
                const handlerConstructorProperty = (0, functions_1.restoreReverseMetadata)(handler);
                if (!endpointsStruct.checkExists(endpoint)) {
                    let newHandler;
                    if (constructor.prototype instanceof handlerConstructorProperty.constructor &&
                        Reflect.getOwnPropertyDescriptor(constructor, handlerConstructorProperty.property)) {
                        newHandler = constructor[handlerConstructorProperty.property];
                    }
                    else {
                        newHandler = handler;
                    }
                    endpoints.push({ ...endpoint, handler: newHandler });
                }
                else {
                    console.warn("endpoint", { endpoint }, "exists into", { constructor });
                }
            });
            Reflect.defineMetadata(ENDPOINTS_METADATA, endpoints, constructor);
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
                if (property && Reflect.getOwnPropertyDescriptor(constructor, property)) {
                    console.warn("property for brigde", { bridge }, "exists into", { constructor });
                }
                else if (property && !bridgesStruct.checkExists(bridge)) {
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
                    console.warn("bridge", { bridge }, "exists into", { constructor });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFRcEQsNENBQTJFO0FBRzNFLFNBQVMsa0JBQWtCLENBQ3pCLFdBQW1CLEVBQ25CLE1BQVMsRUFDVCxXQUF3QjtJQUV4QixPQUFPLENBQUMsY0FBYyxDQUNwQixXQUFXLEVBQ1gsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQ3hFLFdBQVcsRUFDWCxNQUFNLENBQUMsUUFBUSxDQUNoQixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQ3hCLFdBQW1CLEVBQ25CLE1BQVMsRUFDVCxXQUF3QjtJQUV4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbEcsT0FBTyxDQUFDLGNBQWMsQ0FDcEIsV0FBVyxFQUNYLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQ3hELFdBQVcsRUFDWCxNQUFNLENBQUMsUUFBUSxDQUNoQixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQWdCLFVBQVU7SUFDeEIsT0FBTyxDQUFDLFdBQVcsRUFBUSxFQUFFO1FBSTNCLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUc3RCxNQUFNLGlCQUFpQixHQUNyQixPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyx5QkFBeUIsRUFBRSxpQkFB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