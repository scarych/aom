"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryField = exports.QueryJoin = void 0;
const constants = __importStar(require("../common/constants"));
function QueryJoin(relation) {
    return (target, property) => {
        const { constructor } = target;
        // checkConstructorProperty(constructor, property);
        const { MONGO_JOIN_FIELDS } = constants;
        // -- set allowed relation by name
        /*
        console.log(
          "add relation to",
          relation,
          relation.constructor,
          relation.name,
          target.constructor,
          target.constructor.name,
          target,
          propertyKey
        );
        // */
        // создадим связь в собственной модели
        const constructorJoinMap = Reflect.getOwnMetadata(MONGO_JOIN_FIELDS, constructor) || new Map();
        constructorJoinMap.set(relation, {
            name: relation.name,
            localField: property,
            foreignField: "_id",
        });
        Reflect.defineMetadata(MONGO_JOIN_FIELDS, constructor, constructorJoinMap);
        // создадим реверсивную связь в целевой модели
        const relationJoinMap = Reflect.getOwnMetadata(MONGO_JOIN_FIELDS, relation) || new Map();
        relationJoinMap.set(constructor, {
            name: constructor.name,
            foreignField: property,
            localField: "_id",
        });
        Reflect.defineMetadata(MONGO_JOIN_FIELDS, relation, relationJoinMap);
        /*
        setWeakMap(target.constructor, {
          [$join(relation.name)]: {
            relation,
            localField: propertyKey,
            foreignField: "_id",
          },
        });
    
        // создадим обратную ассоциацию для будущих применений
        setWeakMap(relation, {
          [$join(target.constructor.name)]: {
            relation: target.constructor,
            foreignField: propertyKey,
            localField: "_id",
          },
        });
        */
        // console.info("related data", relation, mongoMap.get(relation));
        // появление связи в общем случае означает следующее
        //
    };
}
exports.QueryJoin = QueryJoin;
function QueryField(originType = undefined) {
    return (target, property) => {
        const { constructor } = target;
        // checkConstructorProperty(constructor, property);
        const { MONGO_QUERY_FIELDS } = constants;
        const queryFieldsData = Reflect.getOwnMetadata(MONGO_QUERY_FIELDS, constructor) || {};
        const designTypeMetakey = "design:type";
        const type = originType || Reflect.getOwnMetadata(designTypeMetakey, target, property);
        if (type) {
            Object.assign(queryFieldsData, { [property]: { type } });
        }
        else {
            throw new Error(constants.MONGO_QUERY_FIELDS_TYPE_ERROR);
        }
        Reflect.defineMetadata(MONGO_QUERY_FIELDS, queryFieldsData, constructor);
    };
}
exports.QueryField = QueryField;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb3JhdG9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tb25nb29zZS9kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrREFBaUQ7QUFFakQsU0FBZ0IsU0FBUyxDQUFDLFFBQVE7SUFDaEMsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUMxQixNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsTUFBTSxDQUFDO1FBQy9CLG1EQUFtRDtRQUNuRCxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxTQUFTLENBQUM7UUFDeEMsa0NBQWtDO1FBQ2xDOzs7Ozs7Ozs7OzthQVdLO1FBQ0wsc0NBQXNDO1FBQ3RDLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxXQUFXLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQy9GLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUU7WUFDL0IsSUFBSSxFQUFFLFFBQVEsQ0FBQyxJQUFJO1lBQ25CLFVBQVUsRUFBRSxRQUFRO1lBQ3BCLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixDQUFDLENBQUM7UUFFM0UsOENBQThDO1FBQzlDLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxDQUFDLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUN6RixlQUFlLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRTtZQUMvQixJQUFJLEVBQUUsV0FBVyxDQUFDLElBQUk7WUFDdEIsWUFBWSxFQUFFLFFBQVE7WUFDdEIsVUFBVSxFQUFFLEtBQUs7U0FDbEIsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFckU7Ozs7Ozs7Ozs7Ozs7Ozs7O1VBaUJFO1FBQ0Ysa0VBQWtFO1FBQ2xFLG9EQUFvRDtRQUNwRCxFQUFFO0lBQ0osQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQTFERCw4QkEwREM7QUFFRCxTQUFnQixVQUFVLENBQUMsVUFBVSxHQUFHLFNBQVM7SUFDL0MsT0FBTyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsRUFBRTtRQUMxQixNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsTUFBTSxDQUFDO1FBQy9CLG1EQUFtRDtRQUNuRCxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsR0FBRyxTQUFTLENBQUM7UUFDekMsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEYsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLENBQUM7UUFDeEMsTUFBTSxJQUFJLEdBQUcsVUFBVSxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3ZGLElBQUksSUFBSSxFQUFFO1lBQ1IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQzFEO2FBQU07WUFDTCxNQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1NBQzFEO1FBQ0QsT0FBTyxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDM0UsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWZELGdDQWVDIn0=