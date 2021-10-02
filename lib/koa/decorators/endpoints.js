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
exports.All = exports.Delete = exports.Options = exports.Put = exports.Patch = exports.Post = exports.Get = exports.Endpoint = void 0;
const constants = __importStar(require("../../common/constants"));
const functions_1 = require("../functions");
const functions_2 = require("../../common/functions");
function bindEndpoint(constructor, endpoint) {
    const metakey = constants.ENDPOINTS_METADATA;
    const endpoints = Reflect.getOwnMetadata(metakey, constructor) || [];
    endpoints.push(endpoint);
    Reflect.defineMetadata(metakey, endpoints, constructor);
}
function defineEndpoint(method, path, handler) {
    if (!handler) {
        return Endpoint(method, path);
    }
    return function (target) {
        const metakey = constants.COMMON_ENDPOINT;
        const descriptor = Reflect.getOwnMetadata(metakey, handler);
        if (descriptor) {
            bindEndpoint(target, {
                descriptor,
                path,
                method,
                handler,
                origin: { ...(0, functions_1.restoreReverseMetadata)(handler) },
            });
        }
        else {
            throw new Error(constants.COMMON_ENDPOINT_ERROR);
        }
    };
}
function Endpoint(method, path) {
    return function (constructor, property, descriptor) {
        (0, functions_2.checkConstructorProperty)(constructor, property);
        (0, functions_1.saveReverseMetadata)(constructor, property);
        if (method && path) {
            bindEndpoint(constructor, {
                descriptor,
                path,
                method,
                handler: constructor[property],
                origin: { constructor, property },
            });
        }
        else {
            const commonEndpointsList = Reflect.getOwnMetadata(constants.COMMON_ENDPOINTS_LIST, constructor) || [];
            commonEndpointsList.push({ constructor, property, descriptor });
            Reflect.defineMetadata(constants.COMMON_ENDPOINTS_LIST, commonEndpointsList, constructor);
            const metakey = constants.COMMON_ENDPOINT;
            Reflect.defineMetadata(metakey, descriptor, constructor[property]);
        }
    };
}
exports.Endpoint = Endpoint;
function Get(path = "/", handler) {
    const method = "get";
    return defineEndpoint(method, path, handler);
}
exports.Get = Get;
function Post(path = "/", handler) {
    const method = "post";
    return defineEndpoint(method, path, handler);
}
exports.Post = Post;
function Patch(path = "/", handler) {
    const method = "patch";
    return defineEndpoint(method, path, handler);
}
exports.Patch = Patch;
function Put(path = "/", handler) {
    const method = "put";
    return defineEndpoint(method, path, handler);
}
exports.Put = Put;
function Options(path = "/", handler) {
    const method = "options";
    return defineEndpoint(method, path, handler);
}
exports.Options = Options;
function Delete(path = "/", handler) {
    const method = "delete";
    return defineEndpoint(method, path, handler);
}
exports.Delete = Delete;
function All(path = "/", handler) {
    const method = "all";
    return defineEndpoint(method, path, handler);
}
exports.All = All;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kcG9pbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2tvYS9kZWNvcmF0b3JzL2VuZHBvaW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0VBQW9EO0FBQ3BELDRDQUEyRTtBQUMzRSxzREFBa0U7QUFTbEUsU0FBUyxZQUFZLENBQUMsV0FBVyxFQUFFLFFBQW1CO0lBQ3BELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQztJQUU3QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDckUsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN6QixPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDMUQsQ0FBQztBQU1ELFNBQVMsY0FBYyxDQUNyQixNQUFtQixFQUNuQixJQUFZLEVBQ1osT0FBd0I7SUFFeEIsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE9BQU8sUUFBUSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMvQjtJQUVELE9BQU8sVUFBVSxNQUFtQjtRQUVsQyxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDO1FBQzFDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTVELElBQUksVUFBVSxFQUFFO1lBRWQsWUFBWSxDQUFDLE1BQU0sRUFBRTtnQkFDbkIsVUFBVTtnQkFDVixJQUFJO2dCQUNKLE1BQU07Z0JBQ04sT0FBTztnQkFDUCxNQUFNLEVBQUUsRUFBRSxHQUFHLElBQUEsa0NBQXNCLEVBQUMsT0FBTyxDQUFDLEVBQUU7YUFDL0MsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbEQ7SUFDSCxDQUFDLENBQUM7QUFDSixDQUFDO0FBUUQsU0FBZ0IsUUFBUSxDQUFDLE1BQW9CLEVBQUUsSUFBYTtJQUMxRCxPQUFPLFVBQ0wsV0FBd0IsRUFDeEIsUUFBa0IsRUFDbEIsVUFBOEI7UUFHOUIsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFJaEQsSUFBQSwrQkFBbUIsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFHM0MsSUFBSSxNQUFNLElBQUksSUFBSSxFQUFFO1lBQ2xCLFlBQVksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3hCLFVBQVU7Z0JBQ1YsSUFBSTtnQkFDSixNQUFNO2dCQUNOLE9BQU8sRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDO2dCQUM5QixNQUFNLEVBQUUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFO2FBQ2xDLENBQUMsQ0FBQztTQUNKO2FBQU07WUFFTCxNQUFNLG1CQUFtQixHQUN2QixPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDN0UsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLHFCQUFxQixFQUFFLG1CQUFtQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRTFGLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUM7WUFDMUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1NBQ3BFO0lBQ0gsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWpDRCw0QkFpQ0M7QUFZRCxTQUFnQixHQUFHLENBQ2pCLE9BQWUsR0FBRyxFQUNsQixPQUF5QjtJQUV6QixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDckIsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBTkQsa0JBTUM7QUFZRCxTQUFnQixJQUFJLENBQ2xCLE9BQWUsR0FBRyxFQUNsQixPQUF5QjtJQUV6QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDdEIsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBTkQsb0JBTUM7QUFZRCxTQUFnQixLQUFLLENBQ25CLE9BQWUsR0FBRyxFQUNsQixPQUF5QjtJQUV6QixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUM7SUFDdkIsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBTkQsc0JBTUM7QUFXRCxTQUFnQixHQUFHLENBQ2pCLE9BQWUsR0FBRyxFQUNsQixPQUF5QjtJQUV6QixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDckIsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBTkQsa0JBTUM7QUFZRCxTQUFnQixPQUFPLENBQ3JCLE9BQWUsR0FBRyxFQUNsQixPQUF5QjtJQUV6QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUM7SUFDekIsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBTkQsMEJBTUM7QUFXRCxTQUFnQixNQUFNLENBQ3BCLE9BQWUsR0FBRyxFQUNsQixPQUF5QjtJQUV6QixNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUM7SUFDeEIsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBTkQsd0JBTUM7QUFXRCxTQUFnQixHQUFHLENBQ2pCLE9BQWUsR0FBRyxFQUNsQixPQUF5QjtJQUV6QixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDckIsT0FBTyxjQUFjLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBTkQsa0JBTUMifQ==