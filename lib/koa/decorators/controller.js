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
// принудительно склонировать метаданные по ключу
function cloneMetadataPlain(metadataKey, origin, constructor) {
    Reflect.defineMetadata(metadataKey, Reflect.getOwnMetadata(metadataKey, origin.constructor, origin.property), constructor, origin.property);
}
// склонировать метаданные, заменив конструктор в соответствующих местах данных
function cloneMetadataList(metadataKey, origin, constructor) {
    const originData = Reflect.getOwnMetadata(metadataKey, origin.constructor, origin.property) || [];
    Reflect.defineMetadata(metadataKey, originData.map((values) => ({ ...values, constructor })), constructor, origin.property);
}
function Controller() {
    return (constructor) => {
        // можно брать только первого родителя, потому что за счет аналогичной работы декоратора, на него
        // будут перенесены все валидные значения из более раннего родителя
        const parentConstructor = Object.getPrototypeOf(constructor);
        // перенесем миддлвари
        const parentMiddlewares = Reflect.getOwnMetadata(constants.MIDDLEWARES_LIST_METADATA, parentConstructor) || [];
        // цикл применяется всегда, потому что проверяем только наличие такого же свойства
        parentMiddlewares.forEach((middleware) => {
            const { property, descriptor } = middleware;
            // проверим, что такого свойства в существующем классе нет
            if (!Reflect.getOwnPropertyDescriptor(constructor, property)) {
                // создадим непосредственно данное свойство
                Reflect.defineProperty(constructor, property, descriptor);
                (0, functions_1.saveReverseMetadata)(constructor, property);
                // объявим данный дескриптор миддлварей
                Reflect.defineMetadata(constants.IS_MIDDLEWARE_METADATA, true, constructor[property]);
                // перенесем декораторы аргументов
                cloneMetadataPlain(constants.PARAMETERS_METADATA, middleware, constructor);
                // перенесем декораторы опенапи
                cloneMetadataPlain(constants.OPEN_API_METADATA, middleware, constructor);
                // перенесем декораторы миддлвари
                cloneMetadataPlain(constants.MIDDLEWARE_METADATA, middleware, constructor);
                // скопируем с преобразованием списка декораторы маркеров
                cloneMetadataList(constants.MARKERS_METADATA, middleware, constructor);
            }
            else {
                console.warn("property for middleware", { middleware }, "exists into", { constructor });
            }
        });
        // перенесем общие ендпоинты
        const parentCommonEndpoints = Reflect.getOwnMetadata(constants.COMMON_ENDPOINTS_LIST, parentConstructor) || [];
        // цикл применяется всегда, потому что проверяем только наличие такого же свойства
        parentCommonEndpoints.forEach((endpoint) => {
            const { property, descriptor } = endpoint;
            // проверим, что такого свойства в существующем классе нет
            if (!Reflect.getOwnPropertyDescriptor(constructor, property)) {
                // создадим непосредственно данное свойство
                Reflect.defineProperty(constructor, property, descriptor);
                // сохраним реверсивную мету
                (0, functions_1.saveReverseMetadata)(constructor, property);
                // объявим данный дескриптор общим ендпоинтом
                Reflect.defineMetadata(constants.COMMON_ENDPOINT, descriptor, constructor[property]);
                // перенесем декораторы аргументов
                cloneMetadataPlain(constants.PARAMETERS_METADATA, endpoint, constructor);
                // перенесем декораторы опенапи
                cloneMetadataPlain(constants.OPEN_API_METADATA, endpoint, constructor);
                // перенесем декораторы миддлвари
                cloneMetadataPlain(constants.MIDDLEWARE_METADATA, endpoint, constructor);
            }
            else {
                console.warn("property for common endpoint", { endpoint }, "exists into", { constructor });
            }
        });
        // перенесем ендпоинты родителя
        const parentEndpoints = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, parentConstructor) || [];
        // если они есть, то выполним остальные процедуры
        if (parentEndpoints.length > 0) {
            // возьмем собственные ендпоинты конструктора
            const endpoints = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, constructor) || [];
            // создадим структуру, которая хранит собственные маршруты класса
            const endpointsStruct = {
                byProperty: {},
                byPathMethod: {},
                add(endpoint) {
                    const { handler, path, method } = endpoint;
                    const { property } = (0, functions_1.restoreReverseMetadata)(handler);
                    this.byProperty[property] = true;
                    this.byPathMethod[`${path}:${method}`] = true;
                },
                // создадим функции сверки отсутствия повторений
                checkExists(endpoint) {
                    const { handler, path, method } = endpoint;
                    const { property } = (0, functions_1.restoreReverseMetadata)(handler);
                    return this.byProperty[property] || this.byPathMethod[`${path}:${method}`];
                },
            };
            // перенесем собственные ендпоинты в структуру
            endpoints.forEach((endpoint) => endpointsStruct.add(endpoint));
            parentEndpoints.forEach((endpoint) => {
                const { descriptor, handler } = endpoint;
                const handlerConstructorProperty = (0, functions_1.restoreReverseMetadata)(handler);
                const { property } = handlerConstructorProperty;
                // проверим, что родительского ендпоинта нет ни в каком виде в дочернем элементе
                if (!endpointsStruct.checkExists(endpoint) &&
                    !Reflect.getOwnPropertyDescriptor(constructor, property)) {
                    // создадим собственный метод с аналогичным дескриптором
                    Reflect.defineProperty(constructor, property, descriptor);
                    // в список ендпоинтов внесем родительский, сохранив конструктор дочернего
                    endpoints.push({ ...endpoint, handler: constructor[property] });
                    // перенесем декораторы аргументов
                    cloneMetadataPlain(constants.PARAMETERS_METADATA, handlerConstructorProperty, constructor);
                    // перенесем декораторы OpenApi
                    cloneMetadataPlain(constants.OPEN_API_METADATA, handlerConstructorProperty, constructor);
                    // перенесем миддлвари
                    cloneMetadataPlain(constants.MIDDLEWARE_METADATA, handlerConstructorProperty, constructor);
                }
                else {
                    console.warn("property or endpoint", { endpoint }, "exists into", { constructor });
                }
            });
            // зафиксируем изменения по ендпоинтам
            Reflect.defineMetadata(constants.ENDPOINTS_METADATA, endpoints, constructor);
        }
        // перенесем бриджи родителя
        const parentBridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, parentConstructor) || [];
        if (parentBridges.length > 0) {
            // обработаем мосты
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
                // создадим функции сверки отсутствия повторений
                checkExists(bridge) {
                    const { property, prefix } = bridge;
                    return this.byProperty[property] || this.byPrefix[prefix];
                },
            };
            bridges.forEach((bridge) => bridgesStruct.add(bridge));
            // пройдемся по родительским мостам и перенесем соответствующие данные
            parentBridges.forEach((bridge) => {
                // если мост завязан на свойство
                const { property, descriptor } = bridge;
                if (bridge.property &&
                    !bridgesStruct.checkExists(bridge) &&
                    !Reflect.getOwnPropertyDescriptor(constructor, property)) {
                    Reflect.defineProperty(constructor, property, descriptor);
                    bridges.push({ ...bridge, constructor });
                    // перенесем декораторы аргументов
                    cloneMetadataPlain(constants.PARAMETERS_METADATA, bridge, constructor);
                    // перенесем декораторы OpenApi
                    cloneMetadataPlain(constants.OPEN_API_METADATA, bridge, constructor);
                    // перенесем мидлвари
                    cloneMetadataPlain(constants.MIDDLEWARE_METADATA, bridge, constructor);
                }
                else if (!bridge.property && !bridgesStruct.checkExists(bridge)) {
                    // если это мост без дескриптора, то просто создадим новую запись
                    bridges.push({ ...bridge, constructor });
                    // перенесем миддлвари
                    cloneMetadataPlain(constants.MIDDLEWARE_METADATA, { ...bridge, property: undefined }, constructor);
                }
                else {
                    console.warn("bridge or property", { bridge }, "exists into", { constructor });
                }
            });
            Reflect.defineMetadata(constants.BRIDGE_METADATA, bridges, constructor);
        }
        // перенесем информацию о теге, если она есть в родителе и нет у дочернего класса
        const openApiTag = Reflect.getOwnMetadata(constants.OPENAPI_TAG, parentConstructor);
        if (openApiTag && !Reflect.getOwnMetadata(constants.OPENAPI_TAG, constructor)) {
            Reflect.defineMetadata(constants.OPENAPI_TAG, openApiTag, constructor);
        }
        // перенесем информацию о схеме безопасности, если она есть в родителе и нет у дочернего класса
        const openApiSecurity = Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, parentConstructor);
        if (openApiSecurity && !Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, constructor)) {
            Reflect.defineMetadata(constants.OPENAPI_SECURITY, openApiSecurity, constructor);
        }
    };
}
exports.Controller = Controller;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFRcEQsNENBQTJFO0FBRTNFLGlEQUFpRDtBQUNqRCxTQUFTLGtCQUFrQixDQUN6QixXQUFtQixFQUNuQixNQUFTLEVBQ1QsV0FBd0I7SUFFeEIsT0FBTyxDQUFDLGNBQWMsQ0FDcEIsV0FBVyxFQUNYLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUN4RSxXQUFXLEVBQ1gsTUFBTSxDQUFDLFFBQVEsQ0FDaEIsQ0FBQztBQUNKLENBQUM7QUFDRCwrRUFBK0U7QUFDL0UsU0FBUyxpQkFBaUIsQ0FDeEIsV0FBbUIsRUFDbkIsTUFBUyxFQUNULFdBQXdCO0lBRXhCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsRyxPQUFPLENBQUMsY0FBYyxDQUNwQixXQUFXLEVBQ1gsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFDeEQsV0FBVyxFQUNYLE1BQU0sQ0FBQyxRQUFRLENBQ2hCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0IsVUFBVTtJQUN4QixPQUFPLENBQUMsV0FBVyxFQUFRLEVBQUU7UUFDM0IsaUdBQWlHO1FBQ2pHLG1FQUFtRTtRQUNuRSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFN0Qsc0JBQXNCO1FBQ3RC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