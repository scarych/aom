"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsDefinition = exports.getDefinitions = void 0;
const functions_1 = require("../common/functions");
// справочник определений
const definitionsSet = new Set();
/**
 * вернуть структуру с определениями
 * @returns Object
 */
function getDefinitions() {
    const result = {};
    definitionsSet.forEach((constructor) => {
        const { name } = constructor;
        Object.assign(result, { [name]: constructor });
    });
    return result;
}
exports.getDefinitions = getDefinitions;
/**
 * декоратор для записи класса в структуру определений
 * @returns {ClassDecorator}
 */
function IsDefinition() {
    return (constructor) => {
        (0, functions_1.checkConstructorProperty)(constructor);
        definitionsSet.add(constructor);
    };
}
exports.IsDefinition = IsDefinition;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvb3BlbmFwaS9kZWZpbml0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxtREFBK0Q7QUFFL0QseUJBQXlCO0FBQ3pCLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFDakM7OztHQUdHO0FBQ0gsU0FBZ0IsY0FBYztJQUM1QixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbEIsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQXdCLEVBQUUsRUFBRTtRQUNsRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ2pELENBQUMsQ0FBQyxDQUFDO0lBQ0gsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQVBELHdDQU9DO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsWUFBWTtJQUMxQixPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUU7UUFDckIsSUFBQSxvQ0FBd0IsRUFBQyxXQUFXLENBQUMsQ0FBQztRQUN0QyxjQUFjLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2xDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFMRCxvQ0FLQyJ9