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
function Use(...middlewares) {
    return function (constructor, property) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.MIDDLEWARE_METADATA;
        const middlewaresList = []
            .concat(Reflect.getOwnMetadata(metakey, constructor, property) || [])
            .concat(middlewares);
        Reflect.defineMetadata(metakey, middlewaresList, constructor, property);
    };
}
exports.Use = Use;
function Middleware() {
    return function (constructor, property, descriptor) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        (0, functions_2.saveReverseMetadata)(constructor, property);
        const listMetakey = constants.MIDDLEWARES_LIST_METADATA;
        const middlewaresList = Reflect.getOwnMetadata(listMetakey, constructor) || [];
        middlewaresList.push({ constructor, property, descriptor });
        Reflect.defineMetadata(listMetakey, middlewaresList, constructor);
        const metakey = constants.IS_MIDDLEWARE_METADATA;
        Reflect.defineMetadata(metakey, true, constructor[property]);
    };
}
exports.Middleware = Middleware;
function Bridge(prefix, nextRoute) {
    return function (constructor, property = undefined, descriptor = undefined) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.BRIDGE_METADATA;
        const bridges = Reflect.getOwnMetadata(metakey, constructor) || [];
        bridges.push({ prefix, nextRoute, constructor, property, descriptor });
        Reflect.defineMetadata(metakey, bridges, constructor);
    };
}
exports.Bridge = Bridge;
function Marker(handler) {
    return function (constructor, property, descriptor) {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.MARKERS_METADATA;
        const markerName = `${constructor.name}:${property}`;
        const markers = Reflect.getOwnMetadata(metakey, constructor, property) || [];
        markers.push({ handler, constructor, descriptor, markerName });
        Reflect.defineMetadata(metakey, markers, constructor, property);
    };
}
exports.Marker = Marker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMva29hL2RlY29yYXRvcnMvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtFQUFvRDtBQUNwRCxzREFBa0U7QUFDbEUsNENBQW1EO0FBV25ELFNBQWdCLEdBQUcsQ0FBQyxHQUFHLFdBQWdDO0lBQ3JELE9BQU8sVUFBVSxXQUFXLEVBQUUsUUFBUztRQUNyQyxJQUFBLG9DQUF3QixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVoRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsbUJBQW1CLENBQUM7UUFFOUMsTUFBTSxlQUFlLEdBQUcsRUFBRTthQUN2QixNQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNwRSxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkIsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxRSxDQUFDLENBQUM7QUFDSixDQUFDO0FBWEQsa0JBV0M7QUFHRCxTQUFnQixVQUFVO0lBQ3hCLE9BQU8sVUFBVSxXQUF3QixFQUFFLFFBQWtCLEVBQUUsVUFBOEI7UUFDM0YsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDaEQsSUFBQSwrQkFBbUIsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFHM0MsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLHlCQUF5QixDQUFDO1FBQ3hELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUMvRSxlQUFlLENBQUMsSUFBSSxDQUFDLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQzVELE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVsRSxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsc0JBQXNCLENBQUM7UUFDakQsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQy9ELENBQUMsQ0FBQztBQUNKLENBQUM7QUFkRCxnQ0FjQztBQUdELFNBQWdCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUztJQUN0QyxPQUFPLFVBQVUsV0FBd0IsRUFBRSxRQUFRLEdBQUcsU0FBUyxFQUFFLFVBQVUsR0FBRyxTQUFTO1FBQ3JGLElBQUEsb0NBQXdCLEVBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWhELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxlQUFlLENBQUM7UUFFMUMsTUFBTSxPQUFPLEdBQWMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQztRQUN2RSxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDeEQsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVZELHdCQVVDO0FBR0QsU0FBZ0IsTUFBTSxDQUFDLE9BQXNCO0lBQzNDLE9BQU8sVUFDTCxXQUF3QixFQUN4QixRQUFrQixFQUNsQixVQUF3QztRQUV4QyxJQUFBLG9DQUF3QixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVoRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUM7UUFDM0MsTUFBTSxVQUFVLEdBQUcsR0FBRyxXQUFXLENBQUMsSUFBSSxJQUFZLFFBQVEsRUFBRSxDQUFDO1FBRTdELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDN0UsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDL0QsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNsRSxDQUFDLENBQUM7QUFDSixDQUFDO0FBZkQsd0JBZUMifQ==