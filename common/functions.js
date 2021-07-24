const constants = require("./constants");

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
function reverseMetadata(constructor, property) {
  const metakey = constants.REVERSE_METADATA;
  Reflect.defineMetadata(metakey, { constructor, property }, constructor[property]);
}

exports.reverseMetadata = reverseMetadata;
// ...
function restoreReverseMetadata(handler) {
  return Reflect.getOwnMetadata(constants.REVERSE_METADATA, handler);
}

exports.restoreReverseMetadata = restoreReverseMetadata;

// ...
function checkOpenAPIMetadata(constructor, property = undefined) {
  const metakey = constants.OPEN_API_METADATA;
  return Reflect.getOwnMetadata(metakey, constructor, property);
}

exports.checkOpenAPIMetadata = checkOpenAPIMetadata;
// ...
function checkOpenAPIContainer(constructor, property = undefined) {
  const metakey = constants.OPEN_API_CONTAINER_METADATA;
  return Reflect.getOwnMetadata(metakey, constructor, property);
}

exports.checkOpenAPIContainer = checkOpenAPIContainer;
