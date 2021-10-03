import * as constants from "./constants";

// extensions functions to make required builds
export function checkConstructorProperty(constructor, property = undefined) {
  if (typeof constructor !== "function") {
    throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
  }
  if (property && typeof constructor[property] !== "function") {
    throw new Error(constants.CONSTRUCTOR_PROPERTY_TYPE_ERROR);
  }
}

// ...
export function getOpenAPIMetadata(constructor, property = undefined) {
  const metakey = constants.OPEN_API_METADATA;
  return Reflect.getOwnMetadata(metakey, constructor, property);
}
