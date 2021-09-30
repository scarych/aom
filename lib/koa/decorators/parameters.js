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
exports.This = exports.StateMap = exports.Route = exports.Cursor = exports.Res = exports.Req = exports.Err = exports.Ctx = exports.Next = exports.Headers = exports.Files = exports.Body = exports.Session = exports.State = exports.Params = exports.Query = exports.Args = void 0;
const constants = __importStar(require("../../common/constants"));
const forwards_1 = require("../forwards");
const functions_1 = require("../../common/functions");
const functions_2 = require("../functions");
function _default(args) {
    return args;
}
function Args(handler = _default) {
    if (typeof handler !== "function")
        throw new Error(constants.PARAMETER_HANDLER_ERROR);
    return (constructor, property, parameterIndex) => {
        (0, functions_1.checkConstructorProperty)(constructor, property);
        const metakey = constants.PARAMETERS_METADATA;
        // ...
        const propertyArguments = Reflect.getOwnMetadata(metakey, constructor, property) || [];
        // может быть стек декораторов, поэтому создадим для них список
        /*
        if (!propertyParameters[parameterIndex])
          propertyParameters[parameterIndex] = [];
          propertyParameters[parameterIndex].push(handler);
          */
        propertyArguments[parameterIndex] = handler;
        Reflect.defineMetadata(metakey, propertyArguments, constructor, property);
    };
}
exports.Args = Args;
// ---
function Query(queryHandler = _default) {
    const handler = function ({ ctx }) {
        return Reflect.apply(queryHandler, null, [ctx.query]);
    };
    return Args(handler);
}
exports.Query = Query;
// ---
function Params(paramName = undefined) {
    const handler = function ({ ctx }) {
        return paramName ? Reflect.get(ctx.params, paramName) : ctx.params;
    };
    return Args(handler);
}
exports.Params = Params;
// ---
function State(stateName = undefined) {
    const handler = function ({ ctx }) {
        return stateName ? Reflect.get(ctx.state, stateName) : ctx.state;
    };
    return Args(handler);
}
exports.State = State;
// ---
function Session(sessionName = undefined) {
    const handler = function ({ ctx }) {
        return sessionName ? Reflect.get(ctx.session, sessionName) : ctx.session;
    };
    return Args(handler);
}
exports.Session = Session;
// ---
function Body(bodyHandler = _default) {
    const handler = function ({ ctx }) {
        return Reflect.apply(bodyHandler, null, [ctx.request.body]);
    };
    return Args(handler);
}
exports.Body = Body;
// ---
function Files() {
    const handler = function ({ ctx }) {
        return ctx.request.files;
    };
    return Args(handler);
}
exports.Files = Files;
// ---
function Headers(headerName = undefined) {
    const handler = function ({ ctx }) {
        return headerName ? Reflect.get(ctx.headers, headerName) : ctx.headers;
    };
    return Args(handler);
}
exports.Headers = Headers;
// ---
function Next() {
    const handler = function (args) {
        return (...handlers) => (0, functions_2.nextSequences)(handlers, args);
    };
    return Args(handler);
}
exports.Next = Next;
// ---
function Ctx() {
    const handler = function ({ ctx }) {
        return ctx;
    };
    return Args(handler);
}
exports.Ctx = Ctx;
// ---
function Err(ErrorConstructor = Error) {
    if (!(ErrorConstructor === Error || ErrorConstructor.prototype instanceof Error))
        throw new Error(constants.ERROR_CONSTRUCTOR_ERROR);
    const handler = function () {
        return function (message, status = 500, data = undefined) {
            return Object.assign(new ErrorConstructor(message), { status, data });
        };
    };
    return Args(handler);
}
exports.Err = Err;
// ---
function Req() {
    const handler = function ({ ctx }) {
        return ctx.request;
    };
    return Args(handler);
}
exports.Req = Req;
// ---
function Res() {
    const handler = function ({ ctx }) {
        return ctx.response;
    };
    return Args(handler);
}
exports.Res = Res;
// ---
function Cursor() {
    const handler = function ({ cursor }) {
        return cursor;
    };
    return Args(handler);
}
exports.Cursor = Cursor;
// ---
function Route() {
    const handler = function ({ route }) {
        return route;
    };
    return Args(handler);
}
exports.Route = Route;
// ---
function StateMap(constructor = undefined) {
    const handler = ({ ctx }) => {
        let _constructor = constructor;
        // если используется `FwdRef`, то в качестве целевого значения используем результат функции
        if (constructor instanceof forwards_1.FwdContainer) {
            _constructor = constructor.exec();
        }
        return _constructor ? ctx.$StateMap.get(_constructor) : ctx.$StateMap;
    };
    return Args(handler);
}
exports.StateMap = StateMap;
// ---
function This(constructor = undefined) {
    if (constructor && !(constructor instanceof Function || constructor instanceof forwards_1.FwdContainer)) {
        throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    }
    const handler = ({ ctx, cursor }) => {
        // локальное значение конструктора, которое при каждом вызове должно быть подсчитано заново
        // иначе при наследовании начинаются глюки с кешированием
        let _constructor;
        // если используется `FwdRef`, то в качестве целевого значения используем результат функции
        if (constructor instanceof forwards_1.FwdContainer) {
            _constructor = constructor.exec();
        }
        _constructor = constructor || cursor.constructor;
        let _this = ctx.$StateMap.get(_constructor);
        if (!_this) {
            _this = Reflect.construct(_constructor, []);
            ctx.$StateMap.set(_constructor, _this);
        }
        return _this;
    };
    return Args(handler);
}
exports.This = This;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9wYXJhbWV0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFDcEQsMENBQTJDO0FBQzNDLHNEQUFrRTtBQUNsRSw0Q0FBNkM7QUFTN0MsU0FBUyxRQUFRLENBQUMsSUFBaUI7SUFDakMsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBZ0IsSUFBSSxDQUFDLFVBQXdCLFFBQVE7SUFDbkQsSUFBSSxPQUFPLE9BQU8sS0FBSyxVQUFVO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUN0RixPQUFPLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsRUFBRTtRQUMvQyxJQUFBLG9DQUF3QixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVoRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsbUJBQW1CLENBQUM7UUFDOUMsTUFBTTtRQUNOLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2RiwrREFBK0Q7UUFDL0Q7Ozs7WUFJSTtRQUNKLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztRQUM1QyxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWpCRCxvQkFpQkM7QUFFRCxNQUFNO0FBQ04sU0FBZ0IsS0FBSyxDQUFDLGVBQXlCLFFBQVE7SUFDckQsTUFBTSxPQUFPLEdBQUcsVUFBVSxFQUFFLEdBQUcsRUFBRTtRQUMvQixPQUFPLE9BQU8sQ0FB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