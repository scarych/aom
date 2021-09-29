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
// принудительно склонировать метаданные по ключу
function cloneMetadataPlain(metadataKey, endpoint, constructor) {
    Reflect.defineMetadata(metadataKey, Reflect.getOwnMetadata(metadataKey, endpoint.constructor, endpoint.property), constructor, endpoint.property);
}
// склонировать метаданные, заменив конструктор в соответствующих местах данных
function cloneMetadataList(metadataKey, endpoint, constructor) {
    Reflect.defineMetadata(metadataKey, Reflect.getOwnMetadata(metadataKey, endpoint.constructor, endpoint.property).map((values) => {
        return { ...values, constructor };
    }), constructor, endpoint.property);
}
function Controller() {
    return (constructor) => {
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
        // можно брать только первого родителя, потому что за счет аналогичной работы декоратора, на него
        // будут перенесены все валидные значения из более раннего родителя
        const parentConstructor = Object.getPrototypeOf(constructor);
        // возьмем ендпоинты родителя
        const parentEndpoints = Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, parentConstructor) || [];
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
                // скопируем с преобразованием списка декораторы маркеров
                cloneMetadataList(constants.MARKERS_METADATA, endpoint, constructor);
                // здесь еще потребуется перенести миддлвари для ендпоинтов и next-ы
            }
            else {
                console.warn("endpoint", endpoint, "exists into", { constructor });
            }
        });
        // зафиксируем изменения по ендпоинтам
        Reflect.defineMetadata(constants.ENDPOINTS_METADATA, endpoints, constructor);
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
        const parentBridges = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, parentConstructor) || [];
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
        });
        Reflect.defineMetadata(constants.BRIDGE_METADATA, bridges, constructor);
        // здесь еще следует перенести миддлвари и, возможно, оставить место для каких-то будущих процедур
    };
}
exports.Controller = Controller;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFHcEQsaURBQWlEO0FBQ2pELFNBQVMsa0JBQWtCLENBQ3pCLFdBQW1CLEVBQ25CLFFBQTZCLEVBQzdCLFdBQXdCO0lBRXhCLE9BQU8sQ0FBQyxjQUFjLENBQ3BCLFdBQVcsRUFDWCxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFDNUUsV0FBVyxFQUNYLFFBQVEsQ0FBQyxRQUFRLENBQ2xCLENBQUM7QUFDSixDQUFDO0FBQ0QsK0VBQStFO0FBQy9FLFNBQVMsaUJBQWlCLENBQ3hCLFdBQW1CLEVBQ25CLFFBQTZCLEVBQzdCLFdBQXdCO0lBRXhCLE9BQU8sQ0FBQyxjQUFjLENBQ3BCLFdBQVcsRUFDWCxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtRQUMxRixPQUFPLEVBQUUsR0FBRyxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUM7SUFDcEMsQ0FBQyxDQUFDLEVBQ0YsV0FBVyxFQUNYLFFBQVEsQ0FBQyxRQUFRLENBQ2xCLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0IsVUFBVTtJQUN4QixPQUFPLENBQUMsV0FBVyxFQUFRLEVBQUU7UUFDM0IsNkNBQTZDO1FBQzdDLE1BQU0sU0FBUyxHQUNiLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMxRSxpRUFBaUU7UUFDakUsTUFBTSxlQUFlLEdBQUc7WUFDdEIs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