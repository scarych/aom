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
        const propertyArguments = Reflect.getOwnMetadata(metakey, constructor, property) || [];
        propertyArguments[parameterIndex] = handler;
        Reflect.defineMetadata(metakey, propertyArguments, constructor, property);
    };
}
exports.Args = Args;
function Query(queryHandler = _default) {
    const handler = function ({ ctx }) {
        return Reflect.apply(queryHandler, null, [ctx.query]);
    };
    return Args(handler);
}
exports.Query = Query;
function Params(paramName = undefined) {
    const handler = function ({ ctx }) {
        return paramName ? Reflect.get(ctx.params, paramName) : ctx.params;
    };
    return Args(handler);
}
exports.Params = Params;
function State(stateName = undefined) {
    const handler = function ({ ctx }) {
        return stateName ? Reflect.get(ctx.state, stateName) : ctx.state;
    };
    return Args(handler);
}
exports.State = State;
function Session(sessionName = undefined) {
    const handler = function ({ ctx }) {
        return sessionName ? Reflect.get(ctx.session, sessionName) : ctx.session;
    };
    return Args(handler);
}
exports.Session = Session;
function Body(bodyHandler = _default) {
    const handler = function ({ ctx }) {
        return Reflect.apply(bodyHandler, null, [ctx.request.body]);
    };
    return Args(handler);
}
exports.Body = Body;
function Files() {
    const handler = function ({ ctx }) {
        return ctx.request.files;
    };
    return Args(handler);
}
exports.Files = Files;
function Headers(headerName = undefined) {
    const handler = function ({ ctx }) {
        return headerName ? Reflect.get(ctx.headers, headerName) : ctx.headers;
    };
    return Args(handler);
}
exports.Headers = Headers;
function Next() {
    const handler = function (args) {
        return (...handlers) => (0, functions_2.nextSequences)(handlers, args);
    };
    return Args(handler);
}
exports.Next = Next;
function Ctx() {
    const handler = function ({ ctx }) {
        return ctx;
    };
    return Args(handler);
}
exports.Ctx = Ctx;
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
function Req() {
    const handler = function ({ ctx }) {
        return ctx.request;
    };
    return Args(handler);
}
exports.Req = Req;
function Res() {
    const handler = function ({ ctx }) {
        return ctx.response;
    };
    return Args(handler);
}
exports.Res = Res;
function Cursor() {
    const handler = function ({ cursor }) {
        return cursor;
    };
    return Args(handler);
}
exports.Cursor = Cursor;
function Route() {
    const handler = function ({ route }) {
        return route;
    };
    return Args(handler);
}
exports.Route = Route;
function StateMap(constructor = undefined) {
    const handler = ({ ctx }) => {
        if (constructor instanceof forwards_1.FwdContainer) {
            constructor = constructor.exec();
        }
        return constructor ? ctx.$StateMap.get(constructor) : ctx.$StateMap;
    };
    return Args(handler);
}
exports.StateMap = StateMap;
function This(constructor = undefined) {
    if (constructor && !(constructor instanceof Function || constructor instanceof forwards_1.FwdContainer)) {
        throw new Error(constants.CONSTRUCTOR_TYPE_ERROR);
    }
    const handler = ({ ctx, cursor }) => {
        let _constuctor;
        if (constructor instanceof forwards_1.FwdContainer) {
            constructor = constructor.exec();
        }
        _constuctor = constructor || cursor.constructor;
        let _this = ctx.$StateMap.get(_constuctor);
        if (!_this) {
            _this = Reflect.construct(_constuctor, []);
            ctx.$StateMap.set(_constuctor, _this);
        }
        return _this;
    };
    return Args(handler);
}
exports.This = This;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9rb2EvZGVjb3JhdG9ycy9wYXJhbWV0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxrRUFBb0Q7QUFDcEQsMENBQTJDO0FBQzNDLHNEQUFrRTtBQUNsRSw0Q0FBNkM7QUFTN0MsU0FBUyxRQUFRLENBQUMsSUFBaUI7SUFDakMsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBZ0IsSUFBSSxDQUFDLFVBQXdCLFFBQVE7SUFDbkQsSUFBSSxPQUFPLE9BQU8sS0FBSyxVQUFVO1FBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsdUJBQXVCLENBQUMsQ0FBQztJQUN0RixPQUFPLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsRUFBRTtRQUMvQyxJQUFBLG9DQUF3QixFQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVoRCxNQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsbUJBQW1CLENBQUM7UUFFOUMsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1FBT3ZGLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxHQUFHLE9BQU8sQ0FBQztRQUM1QyxPQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDNUUsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQWpCRCxvQkFpQkM7QUFHRCxTQUFnQixLQUFLLENBQUMsZUFBeUIsUUFBUTtJQUNyRCxNQUFNLE9BQU8sR0FBRyxVQUFVLEVBQUUsR0FBRyxFQUFFO1FBQy9CLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFD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