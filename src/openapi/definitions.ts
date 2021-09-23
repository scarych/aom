import { Constructor } from "../common/declares";
import { checkConstructorProperty } from "../common/functions";

// справочник определений
const definitionsSet = new Set();
/**
 * вернуть структуру с определениями
 * @returns Object
 */
export function getDefinitions(): Record<string, Constructor> {
  const result = {};
  definitionsSet.forEach((constructor: Constructor) => {
    const { name } = constructor;
    Object.assign(result, { [name]: constructor });
  });
  return result;
}

/**
 * декоратор для записи класса в структуру определений
 * @returns {ClassDecorator}
 */
export function IsDefinition(): ClassDecorator {
  return (constructor) => {
    checkConstructorProperty(constructor);
    definitionsSet.add(constructor);
  };
}
