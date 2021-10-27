import { targetConstructorToSchema } from "class-validator-jsonschema";
import { SchemaObject } from "openapi3-ts";
import { defaultMetadataStorage } from "class-transformer/cjs/storage";
import { refPointerPrefix } from "./component-schema";

export function toJSONSchema(constructor): SchemaObject {
  if (typeof constructor === "function") {
    return targetConstructorToSchema(constructor, {
      classTransformerMetadataStorage: defaultMetadataStorage,
      refPointerPrefix,
    });
  } else {
    return <SchemaObject>constructor;
  }
}
