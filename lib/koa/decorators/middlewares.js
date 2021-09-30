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
                rawMiddlewares.push((0, functions_2.restoreReverseMetadata)(middleware));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMva29hL2RlY29yYXRvcnMvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtFQUFvRDtBQUNwRCxzREFBa0U7QUFDbEUsNENBQTJFO0FBVTNFLDBDQUEyQztBQUUzQyxNQUFNO0FBQ04sU0FBZ0IsR0FBRyxDQUFDLEdBQUcsV0FBZ0M7SUFDckQsT0FBTyxVQUFVLFdBQVcsRUFBRSxRQUFTO1FBQ3JDLElBQUEsb0NBQXdCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWhELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQztRQUM5Qyx3REFBd0Q7UUFDeEQsbURBQW1EO1FBQ25ELE1BQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQztRQUMxQixXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBNkIsRUFBRSxFQUFFO1lBQ3BELElBQUksVUFBVSxZQUFZLHVCQUFZLEVBQUU7Z0JBQ3RDLGNBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDakM7aUJBQU07Z0JBQ0wsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFBLGtDQUFzQixFQUFrQixVQUFVLENBQUMsQ0FBQyxDQUFDO2FBQzFFO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxNQUFNO1FBQ04sTUFBTSxlQUFlLEdBQUcsRUFBRTthQUN2QixNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNwRSxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDMUIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxRSxDQUFDLENBQUM7QUFDSixDQUFDO0FBckJE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