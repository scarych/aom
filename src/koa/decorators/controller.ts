import * as constants from "../../common/constants";

export function Controller(): ClassDecorator {
  return (constructor): void => {
    // итак, что должно происходить в контроллере
    // в первую очередь, необходимо получить структуру всех маршрутов и миддлварей
    // которые есть в родительском классе
    // Object.getPrototypeOf(constructor)
    // return constructor;
  };
}
