import * as constants from "../../common/constants";
import {
  IEndpoint,
  ConstructorPropertyDescriptor,
  Constructor,
  IBridge,
  ConstructorProperty,
} from "../../common/declares";

// принудительно склонировать метаданные по ключу
function cloneMetadataPlain<T extends ConstructorProperty>(
  metadataKey: string,
  origin: T,
  constructor: Constructor
) {
  Reflect.defineMetadata(
    metadataKey,
    Reflect.getOwnMetadata(metadataKey, origin.constructor, origin.property),
    constructor,
    origin.property
  );
}
// склонировать метаданные, заменив конструктор в соответствующих местах данных
function cloneMetadataList<T extends ConstructorProperty>(
  metadataKey: string,
  origin: T,
  constructor: Constructor
) {
  const originData = Reflect.getOwnMetadata(metadataKey, origin.constructor, origin.property) || [];
  Reflect.defineMetadata(
    metadataKey,
    originData.map((values) => ({ ...values, constructor })),
    constructor,
    origin.property
  );
}

export function Controller(): ClassDecorator {
  return (constructor): void => {
    // можно брать только первого родителя, потому что за счет аналогичной работы декоратора, на него
    // будут перенесены все валидные значения из более раннего родителя
    const parentConstructor = Object.getPrototypeOf(constructor);
    // возьмем ендпоинты родителя
    const parentEndpoints: IEndpoint[] =
      Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, parentConstructor) || [];
    if (parentEndpoints.length > 0) {
      // возьмем собственные ендпоинты конструктора
      const endpoints: IEndpoint[] =
        Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, constructor) || [];
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
      parentEndpoints.forEach((endpoint: IEndpoint) => {
        const { property, path, method, descriptor } = endpoint;
        // проверим, что родительского ендпоинта нет ни в каком виде в дочернем элементе
        if (
          !endpointsStruct.checkExists(endpoint) &&
          !Reflect.getOwnPropertyDescriptor(constructor, property)
        ) {
          // создадим собственный метод с аналогичным дескриптором
          Reflect.defineProperty(constructor, property, descriptor);
          // в список ендпоинтов внесем родительский, сохранив конструктор дочернего
          endpoints.push({ ...endpoint, constructor });
          // перенесем декораторы аргументов
          cloneMetadataPlain(constants.PARAMETERS_METADATA, endpoint, constructor);
          // перенесем декораторы OpenApi
          cloneMetadataPlain(constants.OPEN_API_METADATA, endpoint, constructor);
          // здесь еще потребуется перенести миддлвари для ендпоинтов и next-ы
        } else {
          console.warn("property or endpoint", { endpoint }, "exists into", { constructor });
        }
      });
      // зафиксируем изменения по ендпоинтам
      Reflect.defineMetadata(constants.ENDPOINTS_METADATA, endpoints, constructor);
    }

    const parentBridges: IBridge[] =
      Reflect.getOwnMetadata(constants.BRIDGE_METADATA, parentConstructor) || [];
    if (parentBridges.length > 0) {
      // обработаем мосты
      const bridges: IBridge[] = Reflect.getOwnMetadata(constants.BRIDGE_METADATA, constructor);
      const bridgesStruct = {
        byProperty: {},
        byPrefix: {},
        add(bridge: IBridge) {
          const { property, prefix } = bridge;
          if (property) {
            this.byProperty[property] = true;
          }
          this.byPrefix[prefix] = true;
        },
        // создадим функции сверки отсутствия повторений
        checkExists(bridge: IBridge) {
          const { property, prefix } = bridge;
          return this.byProperty[property] || this.byPrefix[prefix];
        },
      };
      bridges.forEach((bridge) => bridgesStruct.add(bridge));
      // пройдемся по родительским мостам и перенесем соответствующие данные
      parentBridges.forEach((bridge: IBridge) => {
        // если мост завязан на свойство
        const { property, descriptor } = bridge;
        if (
          bridge.property &&
          !bridgesStruct.checkExists(bridge) &&
          !Reflect.getOwnPropertyDescriptor(constructor, property)
        ) {
          Reflect.defineProperty(constructor, property, descriptor);
          bridges.push({ ...bridge, constructor });
          // перенесем декораторы аргументов
          cloneMetadataPlain(
            constants.PARAMETERS_METADATA,
            <ConstructorProperty>bridge,
            constructor
          );
          // перенесем декораторы OpenApi
          cloneMetadataPlain(constants.OPEN_API_METADATA, <ConstructorProperty>bridge, constructor);
        } else if (!bridge.property && !bridgesStruct.checkExists(bridge)) {
          // если это мост без дескриптора, то просто создадим новую запись
          bridges.push({ ...bridge, constructor });
        } else {
          console.warn("bridge or property", { bridge }, "exists into", { constructor });
        }
      });
      Reflect.defineMetadata(constants.BRIDGE_METADATA, bridges, constructor);
    }
    // перенесем миддлвари
    const parentMiddlewares: ConstructorPropertyDescriptor[] =
      Reflect.getOwnMetadata(constants.MIDDLEWARES_LIST_METADATA, parentConstructor) || [];
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
      } else {
        console.warn("property", { middleware }, "exists into", { constructor });
      }
    });
    // здесь еще следует перенести миддлвари и, возможно, оставить место для каких-то будущих процедур
  };
}
