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
exports.Marker = exports.Bridge = exports.Middleware = exports.Use = void 0;
const constants = __importStar(require("../../common/constants"));
const functions_1 = require("../../common/functions");
const functions_2 = require("../functions");
const forwards_1 = require("../forwards");
// ...
function Use(...middlewares) {
    return function (constructor, property) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.MIDDLEWARE_METADATA;
        // преобразуем handler-ы миддлварей в последовательность
        // `ConstructorProperty` и `FwdContainer` элементов
        const rawMiddlewares = [];
        middlewares.forEach((middleware) => {
            if (middleware instanceof forwards_1.FwdContainer) {
                rawMiddlewares.push(middleware);
            }
            else {
                const middlewareData = (0, functions_2.restoreReverseMetadata)(middleware);
                // тут хитрый маневр: если используемая миддлварь является родительской для текущего конструктора
                // то заменим в ней конструктор, чтобы заменить контекст 
                // (может баговать, когда надо реально использовать миддлварь из родителя, но я пока не вижу, когда такое может возникнуть)
                if (constructor.prototype instanceof middlewareData.constructor) {
                    Object.assign(middlewareData, { constructor });
                }
                rawMiddlewares.push(middlewareData);
            }
        });
        // ...
        const middlewaresList = []
            .concat(Reflect.getOwnMetadata(metakey, constructor, property) || [])
            .concat(rawMiddlewares);
        Reflect.defineMetadata(metakey, middlewaresList, constructor, property);
    };
}
exports.Use = Use;
// ...
function Middleware() {
    return function (constructor, property, descriptor) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        (0, functions_2.saveReverseMetadata)(constructor, property);
        // сохраним в контексте конструктора список
        const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
        const middlewaresList = Reflect.getOwnMetadata(listMetakey, constructor) || [];
        middlewaresList.push({ constructor, property, descriptor });
        Reflect.defineMetadata(listMetakey, middlewaresList, constructor);
        const metakey = constants.IS_MIDDLEWARE_METADATA;
        // Reflect.defineMetadata(metakey, true, constructor[property]);
        // дополнительное сохранение
        Reflect.defineMetadata(metakey, true, constructor, property);
    };
}
exports.Middleware = Middleware;
// ...
function Bridge(prefix, nextRoute) {
    return function (constructor, property = undefined, descriptor = undefined) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.BRIDGE_METADATA;
        // ...
        const bridges = Reflect.getOwnMetadata(metakey, constructor) || [];
        bridges.push({ prefix, nextRoute, constructor, property, descriptor });
        Reflect.defineMetadata(metakey, bridges, constructor);
    };
}
exports.Bridge = Bridge;
// ...
function Marker(handler) {
    return function (constructor, property, descriptor) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.MARKERS_METADATA;
        const markerName = `${constructor.name}:${property}`;
        // ...
        const markers = Reflect.getOwnMetadata(metakey, constructor, property) || [];
        markers.push({ handler, constructor, descriptor, markerName });
        Reflect.defineMetadata(metakey, markers, constructor, property);
    };
}
exports.Marker = Marker;
/*
// ...
export function Sticker(): MethodDecorator {
  return function (
    constructor: Constructor,
    property: Property,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    if (typeof constructor !== "function") throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    const metakey = constants.IS_STICKER_METADATA;
    const stickerName = `${constructor.name}:${<string>property}`;
    // ...
    Reflect.defineMetadata(metakey, stickerName, constructor, property);
  };
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMva29hL2RlY29yYXRvcnMvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtFQUFvRDtBQUNwRCxzREFBa0U7QUFDbEUsNENBQTJFO0FBVTNFLDBDQUEyQztBQUUzQyxNQUFNO0FBQ04sU0FBZ0IsR0FBRyxDQUFDLEdBQUcsV0FBZ0M7SUFDckQsT0FBTyxVQUFVLFdBQVcsRUFBRSxRQUFTO1FBQ3JDLElBQUEsb0NBQXdCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWhELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztRQUM5Qyx3REFBd0Q7UUFDeEQsbURBQW1EO1FBQ25ELE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUMxQixXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBNkIsRUFBRSxFQUFFO1lBQ3BELElBQUksVUFBVSxZQUFZLHVCQUFZLEVBQUU7Z0JBQ3RDLGNBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDakM7aUJBQU07Z0JBQ0wsTUFBTSxjQUFjLEdBQUcsSUFBQSxrQ0FBc0IsRUFBa0IsVUFBVSxDQUFDLENBQUM7Z0JBQzNFLGlHQUFpRztnQkFDakcseURBQXlEO2dCQUN6RCwySEFBMkg7Z0JBQzNILElBQUksV0FBVyxDQUFDLFNBQVMsWUFBWSxjQUFjLENBQUMsV0FBVyxFQUFHO29CQUNoRSxNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7aUJBQ2hEO2dCQUNELGNBQWMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7YUFDckM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILE1BQU07UUFDTixNQUFNLGVBQWUsR0FBRyxFQUFFO2FBQ3ZCLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ3BFLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUMxQixPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFFLENBQUMsQ0FBQztBQUNKLENBQUM7QUE1QkQsa0JBNEJDO0FBRUQsTUFBTTtBQUNOLFNBQWdCLFVBQVU7SUFDeEIsT0FBTyxVQUFVLFdBQXdCLEVBQUUsUUFBa0IsRUFBRSxVQUE4QjtRQUMzRixJQUFBLG9DQUF3QixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNoRCxJQUFBLCtCQUFtQixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUUzQywyQ0FBMkM7UUFDM0MsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLHlCQUF5QixDQUFDO1FBQ3hELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvRSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQzVELE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVsRSxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsc0JBQXNCLENBQUM7UUFDakQsZ0VBQWdFO1FBQ2hFLDRCQUE0QjtRQUM1QixPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQy9ELENBQUMsQ0FBQztBQUNKLENBQUM7QUFoQkQsZ0NBZ0JDO0FBRUQsTUFBTTtBQUNOLFNBQWdCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUztJQUN0QyxPQUFPLFVBQVUsV0FBd0IsRUFBRSxRQUFRLEdBQUcsU0FBUyxFQUFFLFVBQVUsR0FBRyxTQUFTO1FBQ3JGLElBQUEsb0NBQXdCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWhELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUM7UUFDMUMsTUFBTTtRQUNOLE1BQU0sT0FBTyxHQUFjLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM5RSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDdkUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3hELENBQUMsQ0FBQztBQUNKLENBQUM7QUFWRCx3QkFVQztBQUVELE1BQU07QUFDTixTQUFnQixNQUFNLENBQUMsT0FBc0I7SUFDM0MsT0FBTyxVQUNMLFdBQXdCLEVBQ3hCLFFBQWtCLEVBQ2xCLFVBQXdDO1FBRXhDLElBQUEsb0NBQXdCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWhELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQyxNQUFNLFVBQVUsR0FBRyxHQUFHLFdBQVcsQ0FBQyxJQUFJLElBQVksUUFBUSxFQUFFLENBQUM7UUFDN0QsTUFBTTtRQUNOLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0UsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDL0QsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNsRSxDQUFDLENBQUM7QUFDSixDQUFDO0FBZkQsd0JBZUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7O0VBZUUifQ==