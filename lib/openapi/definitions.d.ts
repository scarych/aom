import { Constructor } from "../common/declares";
/**
 * вернуть структуру с определениями
 * @returns Object
 */
export declare function getDefinitions(): Record<string, Constructor>;
/**
 * декоратор для записи класса в структуру определений
 * @returns {ClassDecorator}
 */
export declare function IsDefinition(): ClassDecorator;
