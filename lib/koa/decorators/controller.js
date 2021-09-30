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
                console.warn("property", { middleware }, "exists into", { constructor });
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
                    const { property, path, method } = endpoint;
                    return this.byProperty[property] || this.byPathMethod[`${path}:${method}`];
                },
            };
            // перенесем собственные ендпоинты в структуру
            endpoints.forEach((endpoint) => endpointsStruct.add(endpoint));
            parentEndpoints.forEach((endpoint) => {
                const { property, path, method, descriptor } = endpoint;
                // проверим, что родительского ендпоинта нет ни в каком виде в дочернем элементе
                if (!endpointsStruct.checkExists(endpoint) &&
                    !Reflect.getOwnPropertyDescriptor(constructor, property)) {
                    // создадим собственный метод с аналогичным дескриптором
                    Reflect.defineProperty(constructor, property, descriptor);
                    // в список ендпоинтов внесем родительский, сохранив конструктор дочернего
                    endpoints.push({ ...endpoint, constructor });
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
        // перенесем информацию о теге, если она есть
        const openApiTag = Reflect.getOwnMetadata(constants.OPENAPI_TAG, parentConstructor);
        if (openApiTag) {
            Reflect.defineMetadata(constants.OPENAPI_TAG, openApiTag, constructor);
        }
        // перенесем информацию о схеме безопасности, если она есть
        const openApiSecurity = Reflect.getOwnMetadata(constants.OPENAPI_SECURITY, parentConstructor);
        if (openApiSecurity) {
            Reflect.defineMetadata(constants.OPENAPI_SECURITY, openApiSecurity, constructor);
        }
    };
}
exports.Controller = Controller;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFRcEQsNENBQW1EO0FBRW5ELGlEQUFpRDtBQUNqRCxTQUFTLGtCQUFrQixDQUN6QixXQUFtQixFQUNuQixNQUFTLEVBQ1QsV0FBd0I7SUFFeEIsT0FBTyxDQUFDLGNBQWMsQ0FDcEIsV0FBVyxFQUNYLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUN4RSxXQUFXLEVBQ1gsTUFBTSxDQUFDLFFBQVEsQ0FDaEIsQ0FBQztBQUNKLENBQUM7QUFDRCwrRUFBK0U7QUFDL0UsU0FBUyxpQkFBaUIsQ0FDeEIsV0FBbUIsRUFDbkIsTUFBUyxFQUNULFdBQXdCO0lBRXhCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsRyxPQUFPLENBQUMsY0FBYyxDQUNwQixXQUFXLEVBQ1gsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFDeEQsV0FBVyxFQUNYLE1BQU0sQ0FBQyxRQUFRLENBQ2hCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0IsVUFBVTtJQUN4QixPQUFPLENBQUMsV0FBVyxFQUFRLEVBQUU7UUFDM0IsaUdBQWlHO1FBQ2pHLG1FQUFtRTtRQUNuRSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFN0Qsc0JBQXNCO1FBQ3RC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