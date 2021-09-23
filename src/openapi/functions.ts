import { IsDefinition } from "./definitions";

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
    Reflect.apply(IsDefinition(), null, [constructor]);
    const { name } = constructor;
    if (isArray) {
      Object.assign(result.properties, {
        [key]: { type: "array", items: { $ref: `#/definitions/${name}` } },
      });
    } else {
      Object.assign(result.properties, {
        [key]: { $ref: `#/definitions/${name}` },
      });
    }
  });

  return result;
}
