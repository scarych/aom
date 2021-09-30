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
        const { constructor, property } = (0, functions_1.restoreReverseMetadata)(handler);
        const metakey = constants.COMMON_ENDPOINT;
        const descriptor = Reflect.getOwnMetadata(metakey, constructor, property);
        // если это ленивый ендпоинт
        if (descriptor) {
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
            Reflect.defineMetadata(metakey, descriptor, constructor, property);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kcG9pbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2tvYS9kZWNvcmF0b3JzL2VuZHBvaW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0VBQW9EO0FBQ3BELDRDQUEyRTtBQUMzRSxzREFBa0U7QUFTbEUsU0FBUyxZQUFZLENBQUMsV0FBVyxFQUFFLFFBQW1CO0lBQ3BELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQztJQUM3QyxNQUFNO0lBQ04sTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3JFLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDekIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLGNBQWMsQ0FDckIsTUFBbUIsRUFDbkIsSUFBWSxFQUNaLE9BQXdCO0lBRXhCLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixPQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDL0I7SUFFRCxPQUFPLFVBQVUsTUFBbUI7UUFDbEMsbURBQW1EO1FBQ25ELE1BQU0sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBQSxrQ0FBc0IsRUFBQyxPQUFPLENBQUMsQ0FBQztRQUNsRSxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsZUFBZSxDQUFDO1FBQzFDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUMxRSw0QkFBNEI7UUFDNUIsSUFBSSxVQUFVLEVBQUU7WUFDZCxZQUFZLENBQUMsTUFBTSxFQUFFLEVBQUUsV0FBVyxF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