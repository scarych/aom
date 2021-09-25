import { Constructor, ConstructorProperty, HandlerFunction, IArgs, ICursor, IRoute, Property } from "../common/declares";
/**
 * создает объект с безопасным JSON выходом, служит для того, чтобы в дамп данных
 * о маршрутах и курсоре не попадала служебная информация
 * @param data Входящий объект
 * @returns
 */
export declare function safeJSON<T = IRoute | ICursor>(data: T): T;
/**
 * сохранить в метаданых реверсивную информацию о классе и имени метода для статичного метода
 * для последующего их определения и передачи даннных в контексте
 *
 * @param constructor
 * @param property
 */
export declare function saveReverseMetadata(constructor: Constructor, property: Property): void;
/** восстановить информацию о классе и имени метода по хендлеру функции */
export declare function restoreReverseMetadata(handler: HandlerFunction): ConstructorProperty;
/**
 * выполнить последовательность в next-функции, или вернуть стандартное next-значение
 *
 * @param handlers список функций, которые следует выполнить, может быть пустым
 * @param contextArgs текущие контекстные значения
 * @returns
 */
export declare function nextSequences(handlers: HandlerFunction[], contextArgs: IArgs): Promise<any>;
export declare function extractParameterDecorators(constructor: Constructor, property: Property): any;
/**
 * извлечь middleware-функции, которые были ранее установлены через `@Use`
 * @param param0
 * @returns
 */
export declare function extractMiddlewares({ constructor, property }: ConstructorProperty, prefix: string): ICursor[];
