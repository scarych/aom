import { Constructor } from "../common/declares";
import { DisplayName, getDisplayName } from "../special/display-name";
import { checkConstructorProperty } from "../common/functions";
import { toJSONSchema } from "./functions";

export const refPointerPrefix = "#/components/schemas/";

// справочник определений
export const componentsSet = new Set();
/**
 * вернуть структуру с определениями
 * @returns Object
 */
export function getComponentsSchemas(): Record<string, Constructor> {
  const result = {};
  componentsSet.forEach((constructor: Constructor) => {
    const name = getDisplayName(constructor);
    Object.assign(result, { [name]: toJSONSchema(constructor) });
  });
  return result;
}

/**
 * декоратор для записи класса в структуру определений
 * @returns {ClassDecorator}
 */
export function ComponentSchema(displayName?: string): ClassDecorator {
  return (constructor) => {
    checkConstructorProperty(constructor);
    // если указано видимое имя, то добавим его для элемента данных
    if (displayName) {
      Reflect.decorate([DisplayName(displayName)], constructor);
    }
    // сохраним в справочнике
    componentsSet.add(constructor);
  };
}
