import { DISPLAY_NAME, DISPLAY_NAME_ERROR } from "../common/constants";
import { CombinedDecorator, ConstructorProperty } from "../common/declares";
import { checkConstructorProperty } from "../common/functions";

const displayNamesMap: Map<string, ConstructorProperty> = new Map();

export function getDisplayName(constructor, property?) {
  return (
    Reflect.getOwnMetadata(DISPLAY_NAME, constructor, property) ||
    (property ? [constructor.name, property].join("_") : constructor.name)
  );
}

export function DisplayName(name: string): CombinedDecorator {
  return function (constructor, property?) {
    checkConstructorProperty(constructor);
    // проверим, чтобы указанное имя до этого не использовалось
    if (displayNamesMap.has(name)) {
      throw new Error(DISPLAY_NAME_ERROR);
    }
    // запишем метаданные и сохраним значение в общей карте
    Reflect.defineMetadata(DISPLAY_NAME, name, constructor, property);
    displayNamesMap.set(name, { constructor, property });
  };
}
