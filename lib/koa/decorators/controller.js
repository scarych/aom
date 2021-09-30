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
        // возьмем ендпоинты родителя
        const parentEndpoints = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, parentConstructor) || [];
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
                    // здесь еще потребуется перенести миддлвари для ендпоинтов и next-ы
                }
                else {
                    console.warn("property or endpoint", { endpoint }, "exists into", { constructor });
                }
            });
            // зафиксируем изменения по ендпоинтам
            Reflect.defineMetadata(constants.ENDPOINTS_METADATA, endpoints, constructor);
        }
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
                }
                else if (!bridge.property && !bridgesStruct.checkExists(bridge)) {
                    // если это мост без дескриптора, то просто создадим новую запись
                    bridges.push({ ...bridge, constructor });
                }
                else {
                    console.warn("bridge or property", { bridge }, "exists into", { constructor });
                }
            });
            Reflect.defineMetadata(constants.BRIDGE_METADATA, bridges, constructor);
        }
        // перенесем миддлвари
        const parentMiddlewares = Reflect.getOwnMetadata(constants.MIDDLEWARES_LIST_METADATA, parentConstructor) || [];
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
                // скопируем с преобразованием списка декораторы маркеров
                cloneMetadataList(constants.MARKERS_METADATA, middleware, constructor);
            }
            else {
                console.warn("property", { middleware }, "exists into", { constructor });
            }
        });
        // здесь еще следует перенести миддлвари и, возможно, оставить место для каких-то будущих процедур
    };
}
exports.Controller = Controller;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFRcEQsNENBQW1EO0FBRW5ELGlEQUFpRDtBQUNqRCxTQUFTLGtCQUFrQixDQUN6QixXQUFtQixFQUNuQixNQUFTLEVBQ1QsV0FBd0I7SUFFeEIsT0FBTyxDQUFDLGNBQWMsQ0FDcEIsV0FBVyxFQUNYLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUN4RSxXQUFXLEVBQ1gsTUFBTSxDQUFDLFFBQVEsQ0FDaEIsQ0FBQztBQUNKLENBQUM7QUFDRCwrRUFBK0U7QUFDL0UsU0FBUyxpQkFBaUIsQ0FDeEIsV0FBbUIsRUFDbkIsTUFBUyxFQUNULFdBQXdCO0lBRXhCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsRyxPQUFPLENBQUMsY0FBYyxDQUNwQixXQUFXLEVBQ1gsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFDeEQsV0FBVyxFQUNYLE1BQU0sQ0FBQyxRQUFRLENBQ2hCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0IsVUFBVTtJQUN4QixPQUFPLENBQUMsV0FBVyxFQUFRLEVBQUU7UUFDM0IsaUdBQWlHO1FBQ2pHLG1FQUFtRTtRQUNuRSxNQUFNLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDN0QsNkJBQTZCO1FBQzdC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