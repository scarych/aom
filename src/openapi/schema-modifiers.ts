import { toJSONSchema } from "./functions";
import { ComponentSchema, componentsSet, refPointerPrefix } from "./component-schema";

export function CombineSchemas(origin, extensions) {
  const result = { type: "object", properties: {}, ...toJSONSchema(origin) };

  Object.keys(extensions).map((key) => {
    let constructor;
    let isArray;
    if (extensions[key] instanceof Array) {
      constructor = extensions[key][0];
      isArray = true;
    } else {
      constructor = extensions[key];
    }
    // применим декоратор `ComponentSchema()` к классу, если тот еще не применялся к нему
    if (!componentsSet.has(constructor)) {
      Reflect.decorate([ComponentSchema()], constructor);
    }
    const { name } = constructor;
    if (isArray) {
      Object.assign(result.properties, {
        [key]: { type: "array", items: { $ref: `${refPointerPrefix}${name}` } },
      });
    } else {
      Object.assign(result.properties, {
        [key]: { $ref: `${refPointerPrefix}${name}` },
      });
    }
  });
  return result;
}

/*
export function PartialSchema(origin) {
  // ...
}

export function PickSchema(origin, properties: string[]) {
  // ...
}

export function OmitSchema(origin, properties: string[]) {
  // ...
}
*/
