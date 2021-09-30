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
    // ...
    const endpoints = Reflect.getOwnMetadata(metakey, constructor) || [];
    endpoints.push(endpoint);
    Reflect.defineMetadata(metakey, endpoints, constructor);
}
/**
 * определить endpoint: вернуть типичный Endpoint по методу, или подключить
 * отложенный endpoint
 */
function defineEndpoint(method, path, handler) {
    if (!handler) {
        return Endpoint(method, path);
    }
    return function (target) {
        // проверим, что данный handler - это lazy endpoint
        const metakey = constants.COMMON_ENDPOINT;
        const descriptor = Reflect.getOwnMetadata(metakey, handler);
        // если это ленивый ендпоинт
        if (descriptor) {
            const { constructor, property } = (0, functions_1.restoreReverseMetadata)(handler);
            bindEndpoint(target, { constructor, property, descriptor, path, method });
        }
        else {
            throw new Error(constants.COMMON_ENDPOINT_ERROR);
        }
    };
}
/**
 *
 * @param method {HTTPMethods} метод endpoint-а
 * @param path {string} путь endpoint-а
 * @returns {MethodDecorator}
 */
function Endpoint(method, path) {
    return function (constructor, property, descriptor) {
        // ...
        (0, functions_2.checkConstructorProperty)(constructor, property);
        // if use static method of class, then will store metadata for it with info about
        // origin class and propertyName, for futher usage
        (0, functions_1.saveReverseMetadata)(constructor, property);
        // если установлены метод и путь, значит используем значение как стандартный endpoint
        if (method && path) {
            bindEndpoint(constructor, {
                constructor,
                property,
                descriptor,
                path,
                method,
                // handler: constructor[property],
            });
        }
        else {
            // сохраним элемент в списке общих ендпоинтов
            const commonEndpointsList = Reflect.getOwnMetadata(constants.COMMON_ENDPOINTS_LIST, constructor) || [];
            commonEndpointsList.push({ constructor, property, descriptor });
            Reflect.defineMetadata(constants.COMMON_ENDPOINTS_LIST, commonEndpointsList, constructor);
            const metakey = constants.COMMON_ENDPOINT;
            Reflect.defineMetadata(metakey, descriptor, constructor[property]);
        }
    };
}
exports.Endpoint = Endpoint;
/**
 * определить endpoint с указанным адресом по методу `GET`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
function Get(path = "/", handler) {
    const method = "get";
    return defineEndpoint(method, path, handler);
}
exports.Get = Get;
/**
 * определить endpoint с указанным адресом по методу `POST`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
function Post(path = "/", handler) {
    const method = "post";
    return defineEndpoint(method, path, handler);
}
exports.Post = Post;
/**
 * определить endpoint с указанным адресом по методу `PATCH`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
function Patch(path = "/", handler) {
    const method = "patch";
    return defineEndpoint(method, path, handler);
}
exports.Patch = Patch;
/**
 * определить endpoint с указанным адресом по методу `PUT`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
function Put(path = "/", handler) {
    const method = "put";
    return defineEndpoint(method, path, handler);
}
exports.Put = Put;
/**
 * определить endpoint с указанным адресом по методу `OPTIONS`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
function Options(path = "/", handler) {
    const method = "options";
    return defineEndpoint(method, path, handler);
}
exports.Options = Options;
/**
 * определить endpoint с указанным адресом по методу `DELETE`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
function Delete(path = "/", handler) {
    const method = "delete";
    return defineEndpoint(method, path, handler);
}
exports.Delete = Delete;
/**
 * определить endpoint с указанным адресом по методу `ALL`
 * @param path адрес пути, по которому осуществляется доступ к endpoint-у
 * @param handler перехваченный endpoint (только для декоратора класса)
 * @returns ClassDecorator | MethodDecorator
 */
function All(path = "/", handler) {
    const method = "all";
    return defineEndpoint(method, path, handler);
}
exports.All = All;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kcG9pbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2tvYS9kZWNvcmF0b3JzL2VuZHBvaW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0VBQW9EO0FBQ3BELDRDQUEyRTtBQUMzRSxzREFBa0U7QUFTbEUsU0FBUyxZQUFZLENBQUMsV0FBVyxFQUFFLFFBQW1CO0lBQ3BELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQztJQUM3QyxNQUFNO0lBQ04sTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3JFLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGNBQWMsQ0FDckIsTUFBbUIsRUFDbkIsSUFBWSxFQUNaLE9BQXdCO0lBRXhCLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixPQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDL0I7SUFFRCxPQUFPLFVBQVUsTUFBbUI7UUFDbEMsbURBQW1EO1FBQ25ELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUM7UUFDMUMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUQsNEJBQTRCO1FBQzVCLElBQUksVUFBVSxFQUFFO1lBQ2QsTUFBTSxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsR0FBRyxJQUFBLGtDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xFLFlBQVksQ0FBQyxNQUFNLEVBQUUsRUFBRSxXQUFXLEVBQUUsUUFBUSxF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