"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsDefinition = exports.getDefinitions = void 0;
const functions_1 = require("../common/functions");
const definitionsSet = new Set();
function getDefinitions() {
    const result = {};
    definitionsSet.forEach((constructor) => {
        const { name } = constructor;
        Object.assign(result, { [name]: constructor });
    });
    return result;
}
exports.getDefinitions = getDefinitions;
function IsDefinition() {
    return (constructor) => {
        (0, functions_1.checkConstructorProperty)(constructor);
        definitionsSet.add(constructor);
    };
}
exports.IsDefinition = IsDefinition;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb3BlbmFwaS9kZWZpbml0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxtREFBK0Q7QUFHL0QsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUtqQyxTQUFnQixjQUFjO0lBQzVCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNsQixjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBd0IsRUFBRSxFQUFFO1FBQ2xELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxXQUFXLENBQUM7UUFDN0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDakQsQ0FBQyxDQUFDLENBQUM7SUFDSCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBUEQsd0NBT0M7QUFNRCxTQUFnQixZQUFZO0lBQzFCLE9BQU8sQ0FBQyxXQUFXLEVBQUUsRUFBRTtRQUNyQixJQUFBLG9DQUF3QixFQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3RDLGNBQWMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbEMsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUxELG9DQUtDIn0=