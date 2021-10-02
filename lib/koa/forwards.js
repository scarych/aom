"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FwdRef = exports.FwdContainer = void 0;
class FwdContainer {
    constructor(fwdFn) {
        this.fwdFn = fwdFn;
    }
    exec() {
        return Reflect.apply(this.fwdFn, undefined, []);
    }
}
exports.FwdContainer = FwdContainer;
function FwdRef(fn) {
    return new FwdContainer(fn);
}
exports.FwdRef = FwdRef;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yd2FyZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMva29hL2ZvcndhcmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQVFBLE1BQWEsWUFBWTtJQUd2QixZQUFZLEtBQWtCO1FBQzVCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxJQUFJO1FBQ0YsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ2xELENBQUM7Q0FDRjtBQVZELG9DQVVDO0FBT0QsU0FBZ0IsTUFBTSxDQUFDLEVBQWU7SUFDcEMsT0FBTyxJQUFJLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBRkQsd0JBRUMifQ==