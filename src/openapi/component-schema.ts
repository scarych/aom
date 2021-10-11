import { Constructor } from "../common/declares";
import { checkConstructorProperty } from "../common/functions";

// справочник определений
const componentsSet = new Set();
/**
 * вернуть структуру с определениями
 * @returns Object
 */
export function getComponentsSchemas(): Record<string, Constructor> {
  const result = {};
  componentsSet.forEach((constructor: Constructor) => {
    const { name } = constructor;
    Object.assign(result, { [name]: constructor });
  });
  return result;
}

/**
 * декоратор для записи класса в структуру определений
 * @returns {ClassDecorator}
 */
export function ComponentSchema(): ClassDecorator {
  return (constructor) => {
    checkConstructorProperty(constructor);
    componentsSet.add(constructor);
  };
}
