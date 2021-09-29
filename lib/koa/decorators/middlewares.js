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
exports.Sticker = exports.Marker = exports.Bridge = exports.Middleware = exports.Use = void 0;
const constants = __importStar(require("../../common/constants"));
const functions_1 = require("../../common/functions");
const functions_2 = require("../functions");
// ...
function Use(...middlewares) {
    return function (constructor, property) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.MIDDLEWARE_METADATA;
        // ...
        const bridges = []
            .concat(Reflect.getOwnMetadata(metakey, constructor, property) || [])
            .concat(middlewares);
        Reflect.defineMetadata(metakey, bridges, constructor, property);
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
        middlewaresList.push({ property, descriptor });
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
// ...
function Sticker() {
    return function (constructor, property, descriptor) {
        if (typeof constructor !== "function")
            throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
        const metakey = constants.IS_STICKER_METADATA;
        const stickerName = `${constructor.name}:${property}`;
        // ...
        Reflect.defineMetadata(metakey, stickerName, constructor, property);
    };
}
exports.Sticker = Sticker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMva29hL2RlY29yYXRvcnMvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtFQUFvRDtBQUNwRCxzREFBa0U7QUFDbEUsNENBQW1EO0FBU25ELE1BQU07QUFDTixTQUFnQixHQUFHLENBQUMsR0FBRyxXQUFnQztJQUNyRCxPQUFPLFVBQVUsV0FBVyxFQUFFLFFBQVM7UUFDckMsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFaEQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLG1CQUFtQixDQUFDO1FBQzlDLE1BQU07UUFDTixNQUFNLE9BQU8sR0FBRyxFQUFFO2FBQ2YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZCLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVhELGtCQVdDO0FBRUQsTUFBTTtBQUNOLFNBQWdCLFVBQVU7SUFDeEIsT0FBTyxVQUFVLFdBQXdCLEVBQUUsUUFBa0IsRUFBRSxVQUE4QjtRQUMzRixJQUFBLG9DQUF3QixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNoRCxJQUFBLCtCQUFtQixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUUzQywyQ0FBMkM7UUFDM0MsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLHlCQUF5QixDQUFDO1FBQ3hELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvRSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDL0MsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRWxFLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxzQkFBc0IsQ0FBQztRQUNqRCxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDL0QsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWRELGdDQWNDO0FBRUQsTUFBTTtBQUNOLFNBQWdCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUztJQUN0QyxPQUFPLFVBQVUsV0FBd0IsRUFBRSxRQUFRLEdBQUcsU0FBUyxFQUFFLFVBQVUsR0FBRyxTQUFTO1FBQ3JGLElBQUEsb0NBQXdCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWhELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUM7UUFDMUMsTUFBTTtRQUNOLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNuRSxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDdkUsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ3hELENBQUMsQ0FBQztBQUNKLENBQUM7QUFWRCx3QkFVQztBQUVELE1BQU07QUFDTixTQUFnQixNQUFNLENBQUMsT0FBc0I7SUFDM0MsT0FBTyxVQUNMLFdBQXdCLEVBQ3hCLFFBQWtCLEVBQ2xCLFVBQXdDO1FBRXhDLElBQUEsb0NBQXdCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWhELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMzQyxNQUFNLFVBQVUsR0FBRyxHQUFHLFdBQVcsQ0FBQyxJQUFJLElBQVksUUFBUSxFQUFFLENBQUM7UUFDN0QsTUFBTTtRQUNOLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0UsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDL0QsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNsRSxDQUFDLENBQUM7QUFDSixDQUFDO0FBZkQsd0JBZUM7QUFHRCxNQUFNO0FBQ04sU0FBZ0IsT0FBTztJQUNyQixPQUFPLFVBQ0wsV0FBd0IsRUFDeEIsUUFBa0IsRUFDbEIsVUFBd0M7UUFFeEMsSUFBSSxPQUFPLFdBQVcsS0FBSyxVQUFVO1lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUN6RixNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsbUJBQW1CLENBQUM7UUFDOUMsTUFBTSxXQUFXLEdBQUcsR0FBRyxXQUFXLENBQUMsSUFBSSxJQUFZLFFBQVEsRUFBRSxDQUFDO1FBQzlELE1BQU07UUFDTixPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3RFLENBQUMsQ0FBQztBQUNKLENBQUM7QUFaRCwwQkFZQyJ9