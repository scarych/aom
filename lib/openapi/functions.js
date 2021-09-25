"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombineSchemas = void 0;
const definitions_1 = require("./definitions");
function CombineSchemas(origin, extensions) {
    const result = { type: "object", properties: {}, ...origin.toJSON() };
    Object.keys(extensions).map((key) => {
        let constructor;
        let isArray;
        if (extensions[key] instanceof Array) {
            constructor = extensions[key][0];
            isArray = true;
        }
        else {
            constructor = extensions[key];
        }
        Reflect.apply((0, definitions_1.IsDefinition)(), null, [constructor]);
        const { name } = constructor;
        if (isArray) {
            Object.assign(result.properties, {
                [key]: { type: "array", items: { $ref: `#/definitions/${name}` } },
            });
        }
        else {
            Object.assign(result.properties, {
                [key]: { $ref: `#/definitions/${name}` },
            });
        }
    });
    return result;
}
exports.CombineSchemas = CombineSchemas;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL29wZW5hcGkvZnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLCtDQUE2QztBQUU3QyxTQUFnQixjQUFjLENBQUMsTUFBTSxFQUFFLFVBQVU7SUFDL0MsTUFBTSxNQUFNLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQztJQUN0RSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1FBQ2xDLElBQUksV0FBVyxDQUFDO1FBQ2hCLElBQUksT0FBTyxDQUFDO1FBQ1osSUFBSSxVQUFVLENBQUMsR0FBRyxDQUFDLFlBQVksS0FBSyxFQUFFO1lBQ3BDLFdBQVcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsT0FBTyxHQUFHLElBQUksQ0FBQztTQUNoQjthQUFNO1lBQ0wsV0FBVyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMvQjtRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBQSwwQkFBWSxHQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDO1FBQzdCLElBQUksT0FBTyxFQUFFO1lBQ1gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFO2dCQUMvQixDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLElBQUksRUFBRSxFQUFFLEVBQUU7YUFDbkUsQ0FBQyxDQUFDO1NBQ0o7YUFBTTtZQUNMLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRTtnQkFDL0IsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxpQkFBaUIsSUFBSSxFQUFFLEVBQUU7YUFDekMsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUF6QkQsd0NBeUJDIn0=