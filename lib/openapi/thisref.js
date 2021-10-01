"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThisRef = exports.ThisRefContainer = void 0;
class ThisRefContainer {
    constructor(fwdFn) {
        this.fwdFn = fwdFn;
    }
    exec(constructor) {
        return Reflect.apply(this.fwdFn, constructor, [constructor]);
    }
}
exports.ThisRefContainer = ThisRefContainer;
function ThisRef(handler) {
    return new ThisRefContainer(handler);
}
exports.ThisRef = ThisRef;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGhpc3JlZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vcGVuYXBpL3RoaXNyZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsTUFBYSxnQkFBZ0I7SUFHM0IsWUFBWSxLQUFzQjtRQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztJQUNyQixDQUFDO0lBRUQsSUFBSSxDQUFDLFdBQVc7UUFDZCxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQy9ELENBQUM7Q0FDRjtBQVZELDRDQVVDO0FBRUQsU0FBZ0IsT0FBTyxDQUFDLE9BQXdCO0lBQzlDLE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QyxDQUFDO0FBRkQsMEJBRUMifQ==