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
function bindEndpoint(constructor, { path, method, property, descriptor }) {
    const metakey = constants.ENDPOINTS_METADATA;
    // ...
    const endpoints = Reflect.getOwnMetadata(metakey, constructor) || [];
    endpoints.push({ path, method, property, descriptor });
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
        const metakey = constants.LAZY_ENDPOINT;
        const descriptor = Reflect.getOwnMetadata(metakey, handler);
        // если 
        if (descriptor) {
            const { constructor, property } = (0, functions_1.restoreReverseMetadata)(handler);
            bindEndpoint(target, { constructor, property, path, method, descriptor });
        }
        else {
            throw new Error(constants.LAZY_ENDPOINT);
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
            bindEndpoint(constructor, { constructor, path, method, property, descriptor });
        }
        else {
            const metakey = constants.LAZY_ENDPOINT;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5kcG9pbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2tvYS9kZWNvcmF0b3JzL2VuZHBvaW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0VBQW9EO0FBQ3BELDRDQUEyRTtBQUMzRSxzREFBa0U7QUFHbEUsU0FBUyxZQUFZLENBQUMsV0FBVyxFQUFFLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFhO0lBQ2xGLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQztJQUM3QyxNQUFNO0lBQ04sTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ3JFLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZELE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUMxRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxjQUFjLENBQ3JCLE1BQW1CLEVBQ25CLElBQVksRUFDWixPQUF3QjtJQUV4QixJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxRQUFRLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQy9CO0lBRUQsT0FBTyxVQUFVLE1BQW1CO1FBQ2xDLG1EQUFtRDtRQUNuRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDO1FBQ3hDLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzVELFFBQVE7UUFDUixJQUFJLFVBQVUsRUFBRTtZQUNkLE1BQU0sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFB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