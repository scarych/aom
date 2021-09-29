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
exports.getOpenAPIMetadata = exports.checkConstructorProperty = void 0;
const constants = __importStar(require("./constants"));
// extensions functions to make required builds
function checkConstructorProperty(constructor, property = undefined) {
    if (typeof constructor !== "function") {
        throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    }
    if (property && typeof constructor[property] !== "function") {
        throw new Error(constants.CONSTRUCTOR_PROPERTY_TYPE_ERROR);
    }
}
exports.checkConstructorProperty = checkConstructorProperty;
// ...
function getOpenAPIMetadata(constructor, property = undefined) {
    const metakey = constants.OPEN_API_METADATA;
    return Reflect.getOwnMetadata(metakey, constructor, property);
}
exports.getOpenAPIMetadata = getOpenAPIMetadata;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbW1vbi9mdW5jdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVEQUF5QztBQUV6QywrQ0FBK0M7QUFDL0MsU0FBZ0Isd0JBQXdCLENBQUMsV0FBVyxFQUFFLFFBQVEsR0FBRyxTQUFTO0lBQ3hFLElBQUksT0FBTyxXQUFXLEtBQUssVUFBVSxFQUFFO1FBQ3JDLE1BQU0sSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLHNCQUFzQixDQUFDLENBQUM7S0FDbkQ7SUFDRCxJQUFJLFFBQVEsSUFBSSxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsS0FBSyxVQUFVLEVBQUU7UUFDM0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsK0JBQStCLENBQUMsQ0FBQztLQUM1RDtBQUNILENBQUM7QUFQRCw0REFPQztBQUVELE1BQU07QUFDTixTQUFnQixrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsUUFBUSxHQUFHLFNBQVM7SUFDbEUsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixDQUFDO0lBQzVDLE9BQU8sT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFIRCxnREFHQyJ9