import { targetConstructorToSchema } from "class-validator-jsonschema";
import { SchemaObject } from "openapi3-ts";
import { defaultMetadataStorage } from "class-transformer/cjs/storage";
import { refPointerPrefix } from "./component-schema";

const noJSONSchemaSet = new Set();

export function toJSONSchema(constructor): SchemaObject {
  if (typeof constructor === "function" && !noJSONSchemaSet.has(constructor)) {
    return targetConstructorToSchema(constructor, {
      classTransformerMetadataStorage: defaultMetadataStorage,
      refPointerPrefix,
    });
  } else {
    return <SchemaObject>(constructor.toJSON ? constructor.toJSON() : constructor);
  }
}

export function NoJSONSchema(): ClassDecorator {
  return (constructor) => {
    noJSONSchemaSet.add(constructor);
  };
}
