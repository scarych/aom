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

function reverseMetadata(constructor, property) {
  const metakey = constants.REVERSE_METADATA;
  Reflect.defineMetadata(metakey, { constructor, property }, constructor[property]);
}

exports.reverseMetadata = reverseMetadata;

// ...
function checkOpenAPIMetadata(handler) {
  const metakey = constants.OPEN_API_METADATA;
  return Reflect.getOwnMetadata(metakey, handler);
}

exports.checkOpenAPIMetadata = checkOpenAPIMetadata;
// ... 
function checkOpenAPIContainer(handler) {
  const metakey = constants.OPEN_API_CONTAINTER_METADATA;
  return Reflect.getOwnMetadata(metakey, handler);
}

exports.checkOpenAPIContainer = checkOpenAPIContainer;
