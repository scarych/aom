import { targetConstructorToSchema } from "class-validator-jsonschema";
import { SchemaObject } from "openapi3-ts";
import { defaultMetadataStorage } from "class-transformer/cjs/storage";
import { refPointerPrefix } from "./component-schema";
import { SchemaConverter } from "class-validator-jsonschema/build/defaultConverters";

const noJSONSchemaSet = new Set();
const additionalConverters = {};

type convertorType = SchemaConverter | SchemaObject;

export function toJSONSchema(constructor): SchemaObject {
  if (typeof constructor === "function" && !noJSONSchemaSet.has(constructor)) {
    return targetConstructorToSchema(constructor, {
      additionalConverters,
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

export function AdditionalConverter(converter: convertorType = {}): ClassDecorator {
  return (constructor) => {
    const { name } = constructor;
    Object.assign(additionalConverters, { [name]: converter });
  };
}
