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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlkZGxld2FyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMva29hL2RlY29yYXRvcnMvbWlkZGxld2FyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGtFQUFvRDtBQUNwRCxzREFBa0U7QUFDbEUsNENBQW1EO0FBVW5ELE1BQU07QUFDTixTQUFnQixHQUFHLENBQUMsR0FBRyxXQUFnQztJQUNyRCxPQUFPLFVBQVUsV0FBVyxFQUFFLFFBQVM7UUFDckMsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFaEQsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLG1CQUFtQixDQUFDO1FBQzlDLE1BQU07UUFDTixNQUFNLE9BQU8sR0FBRyxFQUFFO2FBQ2YsTUFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDcEUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZCLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDbEUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQVhELGtCQVdDO0FBRUQsTUFBTTtBQUNOLFNBQWdCLFVBQVU7SUFDeEIsT0FBTyxVQUFVLFdBQXdCLEVBQUUsUUFBa0IsRUFBRSxVQUE4QjtRQUMzRixJQUFBLG9DQUF3QixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUNoRCxJQUFBLCtCQUFtQixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUUzQywyQ0FBMkM7UUFDM0MsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLHlCQUF5QixDQUFDO1FBQ3hELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxJQUFJ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