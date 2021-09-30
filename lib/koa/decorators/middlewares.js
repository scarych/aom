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
// ...
function Use(...middlewares) {
    return function (constructor, property) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.MIDDLEWARE_METADATA;
        // ...
        const middlewaresList = []
            .concat(Reflect.getOwnMetadata(metakey, constructor, property) || [])
            .concat(middlewares);
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
        Reflect.defineMetadata(metakey, true, constructor[property]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMva29hL2RlY29yYXRvcnMvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtFQUFvRDtBQUNwRCxzREFBa0U7QUFDbEUsNENBQW1EO0FBVW5ELE1BQU07QUFDTixTQUFnQixHQUFHLENBQUMsR0FBRyxXQUFnQztJQUNyRCxPQUFPLFVBQVUsV0FBVyxFQUFFLFFBQVM7UUFDckMsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFaEQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLG1CQUFtQixDQUFDO1FBQzlDLE1BQU07UUFDTixNQUFNLGVBQWUsR0FBRyxFQUFFO2FBQ3ZCLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ3BFLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2QixPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzFFLENBQUMsQ0FBQztBQUNKLENBQUM7QUFYRCxrQkFXQztBQUVELE1BQU07QUFDTixTQUFnQixVQUFVO0lBQ3hCLE9BQU8sVUFBVSxXQUF3QixFQUFFLFFBQWtCLEVBQUUsVUFBOEI7UUFDM0YsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDaEQsSUFBQSwrQkFBbUIsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFM0MsMkNBQTJDO1FBQzNDLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyx5QkFBeUIsQ0FBQztRQUN4RCxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDL0UsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUM1RCxPQUFPLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFbEUsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLHNCQUFzQixDQUFDO1FBQ2pELE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUMvRCxDQUFDLENBQUM7QUFDSixDQUFDO0FBZEQsZ0NBY0M7QUFFRCxNQUFNO0FBQ04sU0FBZ0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxTQUFTO0lBQ3RDLE9BQU8sVUFBVSxXQUF3QixFQUFFLFFBQVEsR0FBRyxTQUFTLEVBQUUsVUFBVSxHQUFHLFNBQVM7UUFDckYsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFaEQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLGVBQWUsQ0FBQztRQUMxQyxNQUFNO1FBQ04sTUFBTSxPQUFPLEdBQWMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUN2RSxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVZELHdCQVVDO0FBRUQsTUFBTTtBQUNOLFNBQWdCLE1BQU0sQ0FBQyxPQUFzQjtJQUMzQyxPQUFPLFVBQ0wsV0FBd0IsRUFDeEIsUUFBa0IsRUFDbEIsVUFBd0M7UUFFeEMsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFaEQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDO1FBQzNDLE1BQU0sVUFBVSxHQUFHLEdBQUcsV0FBVyxDQUFDLElBQUksSUFBWSxRQUFRLEVBQUUsQ0FBQztRQUM3RCxNQUFNO1FBQ04sTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM3RSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUMvRCxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ2xFLENBQUMsQ0FBQztBQUNKLENBQUM7QUFmRCx3QkFlQztBQUVEOzs7Ozs7Ozs7Ozs7Ozs7RUFlRSJ9