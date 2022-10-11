import { FwdContainer } from "../references/forwards";
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
      const skipKeys = ["constructor", "handler", "property", "middlewares", "cursors", "origin"];
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
    const { prefix } = contextArgs.cursor;
    //
    let { constructor, property } = restoreReverseMetadata(handler) || <ConstructorProperty>{};
    if (constructor && property) {
      // а также useNext для текущего обработчика
      // замена контекста констуктора, если он является предком для текущего курсора
      if (contextArgs.cursor.constructor.prototype instanceof constructor) {
        constructor = contextArgs.cursor.constructor;
      }
      /* 
      этот код заготовлен на тот случай, если мне потребуется внедрить использование
      use- и useNext-функций, тогда его следует раскомментировать и закомментировать все
      что идет ниже, это работает, но для этого следует переделать достаточно много существующей
      логики
      возможно это должно быть аргументом для `@Next()` декоратора, который означает, что надо
      брать все окружение
      но это неточно
      // тут следует извлечь мидлвари для текущего обработчика
      const runBefore = extractMiddlewares({ constructor, property }, prefix);
      // а также `UseNext` для текущего обработчика
      const runAfter = extractNextFunctions({ constructor, property }, prefix);
      // создадим текущий вызорв
      const current = { ...contextArgs.cursor, handler, constructor, property };
      // таким образом получается, что в данном месте следует последовательно вызывать
      // всю полученную цепочку курсоров, которая будет состоять из
      const callSequence = [...runBefore, current, ...runAfter];

      while (!returnValue && callSequence.length) {
        const cursor = callSequence.shift();
        const { constructor, property, handler } = cursor;
        const decoratedArgs = extractParameterDecorators(constructor, property);
        const args = await Promise.map(
          decoratedArgs,
          async (arg) =>
            arg && (await Reflect.apply(arg, constructor, [{ ...contextArgs, cursor }]))
        );
        args.push(contextArgs);

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
      */

      // /*
      // создадим текущий вызорв
      const cursor = { ...contextArgs.cursor, constructor, property };

      const decoratedArgs = extractParameterDecorators(constructor, property);
      // локальным курсором будет значение с данными исполняемого элемента для сохранения
      // валидного контекста на аргументах
      const args = await Promise.map(
        decoratedArgs,
        async (arg) => arg && (await Reflect.apply(arg, constructor, [{ ...contextArgs, cursor }]))
      );
      args.push(contextArgs);

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
export function extractMiddlewares(origin: ConstructorProperty, prefix: string): ICursor[] {
  const { constructor, property = undefined } = origin;
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
        origin,
      });
    } else {
      throw new Error(constants.IS_MIDDLEWARE_ERROR);
    }
  });

  return resultMiddlewares.map((middleware) => {
    // здесь проверим, что если миддлварьки наследуются от оригинала
    // то перенесем значение конструктора
    if (origin.constructor.prototype instanceof middleware.constructor) {
      middleware.constructor = origin.constructor;
    }
    return middleware;
  });
}

// извлечение next-функций для ендпоинтов
export function extractNextFunctions(origin: ConstructorProperty, prefix: string): ICursor[] {
  const result = [];
  const { constructor, property } = origin;
  let handler = Reflect.getOwnMetadata(constants.USE_NEXT_METADATA, constructor, property);
  if (handler) {
    if (handler instanceof FwdContainer) {
      handler = handler.exec();
    }
    // частью составного маршрута является всегда общий ендпоинт
    if (Reflect.getOwnMetadata(constants.COMMON_ENDPOINT, handler)) {
      const handlerConstructorProperty = restoreReverseMetadata(handler);
      // если next-функция использует middleware, то добавим и их перед вызовом актуального значения
      result.push(...extractMiddlewares(handlerConstructorProperty, prefix));
      // добавим непосредственно next-вызов
      result.push({
        handler,
        ...handlerConstructorProperty,
        prefix,
        origin,
      });
      // добавим потенциально следующий next-вызов
      result.push(...extractNextFunctions(handlerConstructorProperty, prefix));
    } else {
      throw new Error(constants.USE_NEXT_ERROR);
    }
  }
  return result;
}
