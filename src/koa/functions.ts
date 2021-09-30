import { FwdContainer } from "./forwards";
import * as constants from "../common/constants";
import { Promise } from "bluebird";
import {
  Constructor,
  ConstructorProperty,
  HandlerFunction,
  IArgs,
  ICursor,
  IRoute,
  Property,
} from "../common/declares";

/**
 * создает объект с безопасным JSON выходом, служит для того, чтобы в дамп данных
 * о маршрутах и курсоре не попадала служебная информация
 * @param data Входящий объект
 * @returns
 */
export function safeJSON<T = IRoute | ICursor>(data: T): T {
  Object.assign(data, {
    toJSON() {
      const skipKeys = ["constructor", "handler", "property", "middlewares", "cursors"];
      const safeEntries = Object.entries(data).filter(([key]) => skipKeys.indexOf(key) < 0);
      return Object.fromEntries(safeEntries);
    },
  });
  return data;
}

/**
 * сохранить в метаданых реверсивную информацию о классе и имени метода для статичного метода
 * для последующего их определения и передачи даннных в контексте
 *
 * @param constructor
 * @param property
 */
export function saveReverseMetadata(constructor: Constructor, property: Property): void {
  const metakey = constants.REVERSE_METADATA;
  Reflect.defineMetadata(metakey, { constructor, property }, constructor[property]);
}

/** восстановить информацию о классе и имени метода по хендлеру функции */
export function restoreReverseMetadata(handler: HandlerFunction): ConstructorProperty {
  return <ConstructorProperty>Reflect.getOwnMetadata(constants.REVERSE_METADATA, handler);
}

/**
 * выполнить последовательность в next-функции, или вернуть стандартное next-значение
 *
 * @param handlers список функций, которые следует выполнить, может быть пустым
 * @param contextArgs текущие контекстные значения
 * @returns
 */
export async function nextSequences(handlers: HandlerFunction[] = [], contextArgs: IArgs) {
  //
  let returnValue;
  while (!returnValue && handlers.length > 0) {
    const handler = handlers.shift();
    //
    const { constructor, property } = restoreReverseMetadata(handler) || <ConstructorProperty>{};
    if (constructor && property) {
      const decoratedArgs = extractParameterDecorators(constructor, property);

      /* временно отключим стикеры как таковые
      // check sticker metadata
      const stickerData = Reflect.getOwnMetadata(
        constants.IS_STICKER_METADATA,
        constructor,
        property
      );

      const { route } = contextArgs;

      if (stickerData && route.constructor.prototype instanceof constructor) {
        // change default cursor constuctor
        Object.assign(contextArgs.cursor, {
          constructor: route.constructor,
          property,
        });
      } else {
        // restore cursor constructor and property
        Object.assign(contextArgs.cursor, { constructor, property });
      } // */

      const args = await Promise.map(
        decoratedArgs,
        async (arg) => arg && (await Reflect.apply(arg, constructor, [contextArgs]))
      );
      args.push(contextArgs);
      // .concat([defaultArguments]);
      const result = await Reflect.apply(handler, constructor, args);

      if (result === contextArgs.next) {
        continue;
      } else if (result instanceof Error) {
        throw result;
      } else {
        returnValue = result;
        break;
      }
    }
  }
  // return default next if  return value wasn't found
  return returnValue || contextArgs.next;
}

export function extractParameterDecorators(constructor: Constructor, property: Property) {
  const metadataKey = constants.PARAMETERS_METADATA;
  return Reflect.getOwnMetadata(metadataKey, constructor, property) || [];
}

/**
 * извлечь middleware-функции, которые были ранее установлены через `@Use`
 * @param param0
 * @returns
 */
// export function extractMiddlewares({ constructor, property = undefined, prefix }) {
export function extractMiddlewares(
  { constructor, property = undefined }: ConstructorProperty,
  prefix: string
): ICursor[] {
  const resultMiddlewares = [];
  // ...
  const metadataKey = constants.MIDDLEWARE_METADATA;
  const propertyMiddlewares = Reflect.getOwnMetadata(metadataKey, constructor, property) || [];

  propertyMiddlewares.forEach((handler) => {
    // если используется FwdRef, то извлечем handler, выполнив функцию
    if (handler instanceof FwdContainer) {
      handler = handler.exec();
    }
    if (Reflect.getOwnMetadata(constants.IS_MIDDLEWARE_METADATA, handler)) {
      //
      const middlewareMapData = restoreReverseMetadata(handler);
      // try to found middlewares for current middlewares and set them before current
      // cyclic links checking onboard
      resultMiddlewares.push(...extractMiddlewares({ ...middlewareMapData }, prefix));
      resultMiddlewares.push({
        ...middlewareMapData,
        handler,
        prefix,
      });
    } else {
      throw new Error(constants.IS_MIDDLEWARE_ERROR);
    }
  });

  return resultMiddlewares;
}
