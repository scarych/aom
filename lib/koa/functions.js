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
function safeJSON(data) {
    Object.assign(data, {
        toJSON() {
            const skipKeys = ["constructor", "handler", "property", "middlewares", "cursors", "origin"];
            const safeEntries = Object.entries(data).filter(([key]) => skipKeys.indexOf(key) < 0);
            return Object.fromEntries(safeEntries);
        },
    });
    return data;
}
exports.safeJSON = safeJSON;
function saveReverseMetadata(constructor, property) {
    const metakey = constants.REVERSE_METADATA;
    Reflect.defineMetadata(metakey, { constructor, property }, constructor[property]);
}
exports.saveReverseMetadata = saveReverseMetadata;
function restoreReverseMetadata(handler) {
    return Reflect.getOwnMetadata(constants.REVERSE_METADATA, handler);
}
exports.restoreReverseMetadata = restoreReverseMetadata;
async function nextSequences(handlers = [], contextArgs) {
    let returnValue;
    while (!returnValue && handlers.length > 0) {
        const handler = handlers.shift();
        const { constructor, property } = restoreReverseMetadata(handler) || {};
        if (constructor && property) {
            const decoratedArgs = extractParameterDecorators(constructor, property);
            const args = await bluebird_1.Promise.map(decoratedArgs, async (arg) => arg && (await Reflect.apply(arg, constructor, [contextArgs])));
            args.push(contextArgs);
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
    return returnValue || contextArgs.next;
}
exports.nextSequences = nextSequences;
function extractParameterDecorators(constructor, property) {
    const metadataKey = constants.PARAMETERS_METADATA;
    return Reflect.getOwnMetadata(metadataKey, constructor, property) || [];
}
exports.extractParameterDecorators = extractParameterDecorators;
function extractMiddlewares(origin, prefix) {
    const { constructor, property = undefined } = origin;
    const resultMiddlewares = [];
    const metadataKey = constants.MIDDLEWARE_METADATA;
    const propertyMiddlewares = Reflect.getOwnMetadata(metadataKey, constructor, property) || [];
    propertyMiddlewares.forEach((handler) => {
        if (handler instanceof forwards_1.FwdContainer) {
            handler = handler.exec();
        }
        if (Reflect.getOwnMetadata(constants.IS_MIDDLEWARE_METADATA, handler)) {
            const middlewareMapData = restoreReverseMetadata(handler);
            resultMiddlewares.push(...extractMiddlewares({ ...middlewareMapData }, prefix));
            resultMiddlewares.push({
                ...middlewareMapData,
                handler,
                prefix,
                origin,
            });
        }
        else {
            throw new Error(constants.IS_MIDDLEWARE_ERROR);
        }
    });
    return resultMiddlewares;
}
exports.extractMiddlewares = extractMiddlewares;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2tvYS9mdW5jdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHlDQUEwQztBQUMxQywrREFBaUQ7QUFDakQsdUNBQW1DO0FBaUJuQyxTQUFnQixRQUFRLENBQXVCLElBQU87SUFDcEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUU7UUFDbEIsTUFBTTtZQUNKLE1BQU0sUUFBUSxHQUFHLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM1RixNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDdEYsT0FBTyxNQUFNLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7S0FDRixDQUFDLENBQUM7SUFDSCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFURCw0QkFTQztBQVNELFNBQWdCLG1CQUFtQixDQUFDLFdBQXdCLEVBQUUsUUFBa0I7SUFDOUUsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLGdCQUFnQixDQUFDO0lBQzNDLE9BQU8sQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3BGLENBQUM7QUFIRCxrREFHQztBQUdELFNBQWdCLHNCQUFzQixDQUFDLE9BQXdCO0lBQzdELE9BQTRCLE9BQU8sQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxD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