import * as constants from "../../common/constants";
import {
  IEndpoint,
  ConstructorPropertyDescriptor,
  Constructor,
  IBridge,
  ConstructorProperty,
} from "../../common/declares";
import { restoreReverseMetadata, saveReverseMetadata } from "../functions";

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
    // console.log(constructor, Reflect.getOwnPropertyDescriptor);
    // можно брать только первого родителя, потому что за счет аналогичной работы декоратора, на него
    // будут перенесены все валидные значения из более раннего родителя
    const parentConstructor = Object.getPrototypeOf(constructor);

    // перенесем миддлвари
    const parentMiddlewares: ConstructorPropertyDescriptor[] =
      Reflect.getOwnMetadata(constants.MIDDLEWARES_LIST_METADATA, parentConstructor) || [];
    // цикл применяется всегда, потому что проверяем только наличие такого же свойства
    parentMiddlewares.forEach((middleware) => {
      const { property, descriptor } = middleware;
      // проверим, что такого свойства в существующем классе нет
      if (!Reflect.getOwnPropertyDescriptor(constructor, property)) {
        // создадим непосредственно данное свойство
        Reflect.defineProperty(constructor, property, {
          value: (...args) => Reflect.apply(descriptor.value, constructor, args),
        });
        saveReverseMetadata(constructor, property);
        // объявим данный дескриптор миддлварей
        Reflect.defineMetadata(constants.IS_MIDDLEWARE_METADATA, true, constructor[property]);

        // сохраним для текущего конструктора список миддлварей
        const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
        const middlewaresList = Reflect.getOwnMetadata(listMetakey, constructor) || [];
        middlewaresList.push({ constructor, property, descriptor });
        Reflect.defineMetadata(listMetakey, middlewaresList, constructor);

        // перенесем декораторы аргументов
        cloneMetadataPlain(constants.PARAMETERS_METADATA, middleware, constructor);
        // перенесем декораторы опенапи
        cloneMetadataPlain(constants.OPEN_API_METADATA, middleware, constructor);
        // перенесем декораторы миддлвари
        cloneMetadataPlain(constants.MIDDLEWARE_METADATA, middleware, constructor);
        // скопируем с преобразованием списка декораторы маркеров
        cloneMetadataList(constants.MARKERS_METADATA, middleware, constructor);
      } else {
        console.warn("property for middleware", { middleware }, "exists into", { constructor });
      }
    });

    const { IS_ENDPOINTS_LIST } = constants;
    // перенесем определения ендпоинтов
    const parentIsEndpoints: ConstructorPropertyDescriptor[] =
      Reflect.getOwnMetadata(IS_ENDPOINTS_LIST, parentConstructor) || [];
    // цикл применяется всегда, потому что проверяем только наличие такого же свойства
    if (parentIsEndpoints.length > 0) {
      const isEndpointsList = Reflect.getOwnMetadata(IS_ENDPOINTS_LIST, constructor) || [];

      parentIsEndpoints.forEach((endpoint) => {
        const { property, descriptor } = endpoint;
        // проверим, что такого свойства в существующем классе нет
        if (!Reflect.getOwnPropertyDescriptor(constructor, property)) {
          Reflect.defineProperty(constructor, property, {
            value: (...args) => Reflect.apply(descriptor.value, constructor, args),
          });
          // сохраним реверсивную мету
          saveReverseMetadata(constructor, property);
          // объявим данный дескриптор ендпоинтом
          Reflect.defineMetadata(constants.IS_ENDPOINT, descriptor, constructor[property]);

          // сохраним для текущего конструктора список общих ендпоинтов
          isEndpointsList.push({ constructor, property, descriptor });

          // перенесем признак "общий ендпоинт", если он характерен исходному значению
          const { COMMON_ENDPOINT } = constants;
          if (Reflect.getOwnMetadata(COMMON_ENDPOINT, endpoint.constructor[property])) {
            Reflect.defineMetadata(COMMON_ENDPOINT, true, constructor[property]);
          }

          // перенесем декораторы аргументов
          cloneMetadataPlain(constants.PARAMETERS_METADATA, endpoint, constructor);
          // перенесем декораторы опенапи
          cloneMetadataPlain(constants.OPEN_API_METADATA, endpoint, constructor);
          // перенесем декораторы миддлвари
          cloneMetadataPlain(constants.MIDDLEWARE_METADATA, endpoint, constructor);
          // перенесем декораторы use next 
          cloneMetadataPlain(constants.USE_NEXT_METADATA, endpoint, constructor);
        } else {
          console.warn(
            "property for endpoint", //
            { endpoint },
            "exists into", //
            { constructor }
          );
        }
      });
      Reflect.defineMetadata(IS_ENDPOINTS_LIST, isEndpointsList, constructor);
    }

    const { ENDPOINTS_METADATA } = constants;
    // перенесем ендпоинты родителя
    const parentEndpoints: IEndpoint[] =
      Reflect.getOwnMetadata(ENDPOINTS_METADATA, parentConstructor) || [];
    // если они есть, то выполним остальные процедуры
    if (parentEndpoints.length > 0) {
      // возьмем собственные ендпоинты конструктора
      const endpoints: IEndpoint[] = Reflect.getOwnMetadata(ENDPOINTS_METADATA, constructor) || [];
      // создадим структуру, которая хранит собственные маршруты класса
      const endpointsStruct = {
        byProperty: {},
        byPathMethod: {},
        add(endpoint) {
          const { path, method } = endpoint;
          this.byPathMethod[`${path}:${method}`] = true;
        },
        // создадим функции сверки отсутствия повторений
        checkExists(endpoint) {
          const { path, method } = endpoint;
          return this.byPathMethod[`${path}:${method}`];
        },
      };
      // перенесем собственные ендпоинты в структуру
      endpoints.forEach((endpoint) => endpointsStruct.add(endpoint));
      parentEndpoints.forEach((endpoint: IEndpoint) => {
        const { handler } = endpoint;
        const handlerConstructorProperty = restoreReverseMetadata(handler);
        if (!endpointsStruct.checkExists(endpoint)) {
          let newHandler;
          // тут проверим, что у нас метаданные хендлера ссылаются на родителя, и поэтому
          // могут и должны быть унаследованы
          if (
            constructor.prototype instanceof handlerConstructorProperty.constructor &&
            Reflect.getOwnPropertyDescriptor(constructor, handlerConstructorProperty.property)
          ) {
            newHandler = constructor[handlerConstructorProperty.property];
          } else {
            // иначе перенесем ендпоинт в чистом виде
            newHandler = handler;
          }
          // в список ендпоинтов внесем родительский, сохранив конструктор дочернего
          endpoints.push({ ...endpoint, handler: newHandler });
        } else {
          console.warn("endpoint", { endpoint }, "exists into", { constructor });
        }
      });
      // зафиксируем изменения по ендпоинтам
      Reflect.defineMetadata(ENDPOINTS_METADATA, endpoints, constructor);
    }

    // перенесем бриджи родителя
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
        if (property && Reflect.getOwnPropertyDescriptor(constructor, property)) {
          console.warn("property for brigde", { bridge }, "exists into", { constructor });
        } else if (property && !bridgesStruct.checkExists(bridge)) {
          Reflect.defineProperty(constructor, property, {
            value: (...args) => Reflect.apply(descriptor.value, constructor, args),
          });
          bridges.push({ ...bridge, constructor });
          // перенесем декораторы аргументов
          cloneMetadataPlain(
            constants.PARAMETERS_METADATA,
            <ConstructorProperty>bridge,
            constructor
          );
          // перенесем декораторы OpenApi
          cloneMetadataPlain(constants.OPEN_API_METADATA, <ConstructorProperty>bridge, constructor);
          // перенесем мидлвари
          cloneMetadataPlain(
            constants.MIDDLEWARE_METADATA,
            <ConstructorProperty>bridge,
            constructor
          );
        } else if (!bridge.property && !bridgesStruct.checkExists(bridge)) {
          // если это мост без дескриптора, то просто создадим новую запись
          bridges.push({ ...bridge, constructor });
          // перенесем миддлвари
          cloneMetadataPlain(
            constants.MIDDLEWARE_METADATA,
            <ConstructorProperty>{ ...bridge, property: undefined },
            constructor
          );
        } else {
          console.warn("bridge", { bridge }, "exists into", { constructor });
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
