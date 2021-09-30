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
                Reflect.defineProperty(constructor, property, descriptor);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFTcEQsaURBQWlEO0FBQ2pELFNBQVMsa0JBQWtCLENBQ3pCLFdBQW1CLEVBQ25CLE1BQVMsRUFDVCxXQUF3QjtJQUV4QixPQUFPLENBQUMsY0FBYyxDQUNwQixXQUFXLEVBQ1gsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQ3hFLFdBQVcsRUFDWCxNQUFNLENBQUMsUUFBUSxDQUNoQixDQUFDO0FBQ0osQ0FBQztBQUNELCtFQUErRTtBQUMvRSxTQUFTLGlCQUFpQixDQUN4QixXQUFtQixFQUNuQixNQUFTLEVBQ1QsV0FBd0I7SUFFeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2xHLE9BQU8sQ0FBQyxjQUFjLENBQ3BCLFdBQVcsRUFDWCxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUN4RCxXQUFXLEVBQ1gsTUFBTSxDQUFDLFFBQVEsQ0FDaEIsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFnQixVQUFVO0lBQ3hCLE9BQU8sQ0FBQyxXQUFXLEVBQVEsRUFBRTtRQUMzQixpR0FBaUc7UUFDakcsbUVBQW1FO1FBQ25FLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM3RCw2QkFBNkI7UUFDN0IsTUFBTSxlQUFlLEdBQ25CLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGtCQUFrQixFQUFFLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2hGLElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDOUIsNkNBQTZDO1lBQzdDLE1BQU0sU0FBUyxHQUNiLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGtCQUFrQixFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxRSxpRUFBaUU7WUFDakUsTUFBTSxlQUFlLEdBQUc7Z0JBQ3RCLFVBQVUsRUFBRSxFQUFFO2dCQUNkLFlBQVksRUFBRSxFQUFFO2dCQUNoQixHQUFHLENBQUMsUUFBUTtvQkFDVixNQUFNLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUM7b0JBQzVDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUNqQyxJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxJQUFJLE1BQU0sRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO2dCQUNoRCxDQUFDO2dCQUNELGdEQUFnRDtnQkFDaEQsV0FBVyxDQUFDLFFBQVE7b0JBQ2xCLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQztvQkFDNUMsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDN0UsQ0FBQzthQUNGLENBQUM7WUFDRiw4Q0FBOEM7WUFDOUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQy9ELGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFtQixFQUFFLEVBQUU7Z0JBQzlDLE1BQU0sRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxRQUFRLENBQUM7Z0JBQ3hELGdGQUFnRjtnQkFDaEYsSUFDRSxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDO29CQUN0QyxDQUFDLE9BQU8sQ0FBQyx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLEVBQ3hEO29CQUNBLHdEQUF3RDtvQkFDeEQsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUMxRCwwRUFBMEU7b0JBQzFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLFFBQVEsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO29CQUM3QyxrQ0FBa0M7b0JBQ2xDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7b0JBQ3pFLCtCQUErQjtvQkFDL0Isa0JBQWtCLENBQUMsU0FBUyxDQUFDLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztvQkFDdkUsb0VBQW9FO2lCQUNyRTtxQkFBTTtvQkFDTCxPQUFPLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUUsYUFBYSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztpQkFDcEY7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILHNDQUFzQztZQUN0QyxPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDOUU7UUFFRCxNQUFNLGFBQWEsR0FDakIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLGlCQUFpQixDQUFDLElBQUksRUFBRSxDQUFDO1FBQzdFLElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDNUIsbUJBQW1CO1lBQ25CLE1BQU0sT0FBTyxHQUFjLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUMxRixNQUFNLGFBQWEsR0FBRztnQkFDcEIsVUFBVSxFQUFFLEVBQUU7Z0JBQ2QsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osR0FBRyxDQUFDLE1BQWU7b0JBQ2pCLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDO29CQUNwQyxJQUFJLFFBQVEsRUFBRTt3QkFDWixJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksQ0FBQztxQkFDbEM7b0JBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7Z0JBQy9CLENBQUM7Z0JBQ0QsZ0RBQWdEO2dCQUNoRCxXQUFXLENBQUMsTUFBZTtvQkFDekIsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUM7b0JBQ3BDLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUM1RCxDQUFDO2FBQ0YsQ0FBQztZQUNGLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN2RCxzRUFBc0U7WUFDdEUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQWUsRUFBRSxFQUFFO2dCQUN4QyxnQ0FBZ0M7Z0JBQ2hDLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEdBQUcsTUFBTSxDQUFDO2dCQUN4QyxJQUNFLE1BQU0sQ0FBQyxRQUFRO29CQUNmLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7b0JBQ2xDLENBQUMsT0FBTyxDQUFDLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsRUFDeEQ7b0JBQ0EsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO29CQUMxRCxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztvQkFDekMsa0NBQWtDO29CQUNsQyxrQkFBa0IsQ0FDaEIsU0FBUyxDQUFDLG1CQUFtQixFQUNSLE1BQU0sRUFDM0IsV0FBVyxDQUNaLENBQUM7b0JBQ0YsK0JBQStCO29CQUMvQixrQkFBa0IsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQXVCLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztpQkFDM0Y7cUJBQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFO29CQUNqRSxpRUFBaUU7b0JBQ2pFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2lCQUMxQztxQkFBTTtvQkFDTCxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsTUFBTSxFQUFFLEVBQUUsYUFBYSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztpQkFDaEY7WUFDSCxDQUFDLENBQUMsQ0FBQztZQUNILE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDekU7UUFDRCxzQkFBc0I7UUFDdEIsTUFBTSxpQkFBaUIsR0FDckIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMseUJBQXlCLEVBQUUsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdkYsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDdkMsTUFBTSxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsR0FBRyxVQUFVLENBQUM7WUFDNUMsMERBQTBEO1lBQzFELElBQUksQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUM1RCxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQzFELGtDQUFrQztnQkFDbEMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDM0UsK0JBQStCO2dCQUMvQixrQkFBa0IsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2dCQUN6RSx5REFBeUQ7Z0JBQ3pELGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7YUFDeEU7aUJBQU07Z0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxVQUFVLEVBQUUsRUFBRSxhQUFhLEVBQUUsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2FBQzFFO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxrR0FBa0c7SUFDcEcsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQTNIRCxnQ0EySEMifQ==