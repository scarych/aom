import { ComponentSchema } from "./component-schema";

export function CombineSchemas(origin, extensions) {
  const result = { type: "object", properties: {}, ...origin.toJSON() };
  Object.keys(extensions).map((key) => {
    let constructor;
    let isArray;
    if (extensions[key] instanceof Array) {
      constructor = extensions[key][0];
      isArray = true;
    } else {
      constructor = extensions[key];
    }
    Reflect.apply(ComponentSchema(), null, [constructor]);
    const { name } = constructor;
    if (isArray) {
      Object.assign(result.properties, {
        [key]: { type: "array", items: { $ref: `#/components/schemas/${name}` } },
      });
    } else {
      Object.assign(result.properties, {
        [key]: { $ref: `#/components/schemas/${name}` },
      });
    }
  });

  return result;
}
