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
                Reflect.defineProperty(constructor, property, {
                    value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                });
                (0, functions_1.saveReverseMetadata)(constructor, property);
                // объявим данный дескриптор миддлварей
                Reflect.defineMetadata(constants.IS_MIDDLEWARE_METADATA, true, constructor, property);
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
                Reflect.defineProperty(constructor, property, {
                    value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                });
                // сохраним реверсивную мету
                (0, functions_1.saveReverseMetadata)(constructor, property);
                // объявим данный дескриптор общим ендпоинтом
                Reflect.defineMetadata(constants.COMMON_ENDPOINT, descriptor, constructor, property);
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
                    const { property, path, method } = endpoint;
                    this.byProperty[property] = true;
                    this.byPathMethod[`${path}:${method}`] = true;
                },
                // создадим функции сверки отсутствия повторений
                checkExists(endpoint) {
                    const { path, method, property } = endpoint;
                    return this.byProperty[property] || this.byPathMethod[`${path}:${method}`];
                },
            };
            // перенесем собственные ендпоинты в структуру
            endpoints.forEach((endpoint) => endpointsStruct.add(endpoint));
            parentEndpoints.forEach((endpoint) => {
                const { descriptor, property } = endpoint;
                // проверим, что родительского ендпоинта нет ни в каком виде в дочернем элементе
                if (!endpointsStruct.checkExists(endpoint) &&
                    !Reflect.getOwnPropertyDescriptor(constructor, property)) {
                    // создадим собственный метод с аналогичным дескриптором
                    const newDescriptor = {
                        value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                    };
                    Reflect.defineProperty(constructor, property, { ...newDescriptor });
                    (0, functions_1.saveReverseMetadata)(constructor, property);
                    // в список ендпоинтов внесем родительский, сохранив конструктор дочернего
                    endpoints.push({ ...endpoint, constructor, descriptor: newDescriptor });
                    // перенесем декораторы аргументов
                    cloneMetadataPlain(constants.PARAMETERS_METADATA, endpoint, constructor);
                    // перенесем декораторы OpenApi
                    cloneMetadataPlain(constants.OPEN_API_METADATA, endpoint, constructor);
                    // перенесем миддлвари
                    cloneMetadataPlain(constants.MIDDLEWARE_METADATA, endpoint, constructor);
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
                    Reflect.defineProperty(constructor, property, {
                        value: (...args) => Reflect.apply(descriptor.value, constructor, args),
                    });
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