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
exports.extractMiddlewares = exports.extractParameterDecorators = exports.nextSequences = exports.restoreReverseMetadata = exports.saveReverseMetadata = exports.safeJSON = void 0;
const forwards_1 = require("./forwards");
const constants = __importStar(require("../common/constants"));
const bluebird_1 = require("bluebird");
/**
 * создает объект с безопасным JSON выходом, служит для того, чтобы в дамп данных
 * о маршрутах и курсоре не попадала служебная информация
 * @param data Входящий объект
 * @returns
 */
function safeJSON(data) {
    Object.assign(data, {
        toJSON() {
            const skipKeys = ["constructor", "handler", "property", "middlewares", "cursors"];
            const safeEntries = Object.entries(data).filter(([key]) => skipKeys.indexOf(key) < 0);
            return Object.fromEntries(safeEntries);
        },
    });
    return data;
}
exports.safeJSON = safeJSON;
/**
 * сохранить в метаданых реверсивную информацию о классе и имени метода для статичного метода
 * для последующего их определения и передачи даннных в контексте
 *
 * @param constructor
 * @param property
 */
function saveReverseMetadata(constructor, property) {
    const metakey = constants.REVERSE_METADATA;
    Reflect.defineMetadata(metakey, { constructor, property }, constructor[property]);
}
exports.saveReverseMetadata = saveReverseMetadata;
/** восстановить информацию о классе и имени метода по хендлеру функции */
function restoreReverseMetadata(handler) {
    return Reflect.getOwnMetadata(constants.REVERSE_METADATA, handler);
}
exports.restoreReverseMetadata = restoreReverseMetadata;
/**
 * выполнить последовательность в next-функции, или вернуть стандартное next-значение
 *
 * @param handlers список функций, которые следует выполнить, может быть пустым
 * @param contextArgs текущие контекстные значения
 * @returns
 */
async function nextSequences(handlers = [], contextArgs) {
    //
    let returnValue;
    while (!returnValue && handlers.length > 0) {
        const handler = handlers.shift();
        //
        const { constructor, property } = restoreReverseMetadata(handler) || {};
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
            } */
            Object.assign(contextArgs.cursor, { constructor, property });
            const args = await bluebird_1.Promise.map(decoratedArgs, async (arg) => arg && (await Reflect.apply(arg, constructor, [contextArgs])));
            args.push(contextArgs);
            // .concat([defaultArguments]);
            const result = await Reflect.apply(handler, constructor, args);
            if (result === contextArgs.next) {
                continue;
            }
            else if (result instanceof Error) {
                throw result;
            }
            else {
                returnValue = result;
                break;
            }
        }
    }
    // return default next if  return value wasn't found
    return returnValue || contextArgs.next;
}
exports.nextSequences = nextSequences;
function extractParameterDecorators(constructor, property) {
    const metadataKey = constants.PARAMETERS_METADATA;
    return Reflect.getOwnMetadata(metadataKey, constructor, property) || [];
}
exports.extractParameterDecorators = extractParameterDecorators;
/**
 * извлечь middleware-функции, которые были ранее установлены через `@Use`
 * @param param0
 * @returns
 */
// export function extractMiddlewares({ constructor, property = undefined, prefix }) {
function extractMiddlewares({ constructor, property = undefined }, prefix) {
    const resultMiddlewares = [];
    // ...
    const metadataKey = constants.MIDDLEWARE_METADATA;
    const propertyMiddlewares = Reflect.getOwnMetadata(metadataKey, constructor, property) || [];
    propertyMiddlewares.forEach((handler) => {
        // если используется FwdRef, то извлечем handler, выполнив функцию
        if (handler instanceof forwards_1.FwdContainer) {
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
        }
        else {
            throw new Error(constants.IS_MIDDLEWARE_ERROR);
        }
    });
    return resultMiddlewares;
}
exports.extractMiddlewares = extractMiddlewares;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tvYS9mdW5jdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHlDQUEwQztBQUMxQywrREFBaUQ7QUFDakQsdUNBQW1DO0FBV25DOzs7OztHQUtHO0FBQ0gsU0FBZ0IsUUFBUSxDQUF1QixJQUFPO0lBQ3BELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO1FBQ2xCLE1BQU07WUFDSixNQUFNLFFBQVEsR0FBRyxDQUFDLGFBQWEsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxTQUFTLENBQUMsQ0FBQztZQUNsRixNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEYsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRixDQUFDLENBQUM7SUFDSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFURCw0QkFTQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLG1CQUFtQixDQUFDLFdBQXdCLEVBQUUsUUFBa0I7SUFDOUUsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDO0lBQzNDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3BGLENBQUM7QUFIRCxrREFHQztBQUVELDBFQUEwRTtBQUMxRSxTQUFnQixzQkFBc0IsQ0FBQyxPQUF3QjtJQUM3RCxPQUE0QixPQUFPLENBQUMsY0FBYyxDQUFDLFNB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