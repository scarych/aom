import * as constants from "../../common/constants";
import { IEndpoint, Constructor, IBridge } from "../../common/declares";

// принудительно склонировать метаданные по ключу
function cloneMetadataPlain(
  metadataKey: string,
  endpoint: IEndpoint | IBridge,
  constructor: Constructor
) {
  Reflect.defineMetadata(
    metadataKey,
    Reflect.getOwnMetadata(metadataKey, endpoint.constructor, endpoint.property),
    constructor,
    endpoint.property
  );
}
// склонировать метаданные, заменив конструктор в соответствующих местах данных
function cloneMetadataList(
  metadataKey: string,
  endpoint: IEndpoint | IBridge,
  constructor: Constructor
) {
  Reflect.defineMetadata(
    metadataKey,
    Reflect.getOwnMetadata(metadataKey, endpoint.constructor, endpoint.property).map((values) => {
      return { ...values, constructor };
    }),
    constructor,
    endpoint.property
  );
}

export function Controller(): ClassDecorator {
  return (constructor): void => {
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
    // можно брать только первого родителя, потому что за счет аналогичной работы декоратора, на него
    // будут перенесены все валидные значения из более раннего родителя
    const parentConstructor = Object.getPrototypeOf(constructor);
    // возьмем ендпоинты родителя
    const parentEndpoints: IEndpoint[] =
      Reflect.getOwnMetadata(constants.ENDPOINTS_METADATA, parentConstructor) || [];

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
        // скопируем с преобразованием списка декораторы маркеров
        cloneMetadataList(constants.MARKERS_METADATA, endpoint, constructor);
        // здесь еще потребуется перенести миддлвари для ендпоинтов и next-ы
      } else {
        console.warn("endpoint", endpoint, "exists into", { constructor });
      }
    });
    // зафиксируем изменения по ендпоинтам
    Reflect.defineMetadata(constants.ENDPOINTS_METADATA, endpoints, constructor);
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
    const parentBridges: IBridge[] =
      Reflect.getOwnMetadata(constants.BRIDGE_METADATA, parentConstructor) || [];
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
        cloneMetadataPlain(constants.PARAMETERS_METADATA, bridge, constructor);
        // перенесем декораторы OpenApi
        cloneMetadataPlain(constants.OPEN_API_METADATA, bridge, constructor);
      } else if (!bridge.property && !bridgesStruct.checkExists(bridge)) {
        // если это мост без дескриптора, то просто создадим новую запись
        bridges.push({ ...bridge, constructor });
      }
    });
    Reflect.defineMetadata(constants.BRIDGE_METADATA, bridges, constructor);
    // здесь еще следует перенести миддлвари и, возможно, оставить место для каких-то будущих процедур
  };
}
