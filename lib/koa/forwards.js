"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FwdRef = exports.FwdContainer = void 0;
/**
 * forward-контейнер для проброски значений из циклических зависимых модулей
 * @property fwdFn хранимая forward-функция, которая извлекается в момент построения конструкта
 *
 * @method exec - выполнение forward-функции и возврат хранимого значения
 */
class FwdContainer {
    constructor(fwdFn) {
        this.fwdFn = fwdFn;
    }
    exec() {
        return Reflect.apply(this.fwdFn, undefined, []);
    }
}
exports.FwdContainer = FwdContainer;
/**
 * создает Forward-контейнер вокруг аргумента, позволяет избежать проблемы
 * циклической зависимости модулей
 * @param fwdFn функция-обертка вокруг маршрутного узла или мидллвари
 * @returns {new FwdContainer}
 */
function FwdRef(fn) {
    return new FwdContainer(fn);
}
exports.FwdRef = FwdRef;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yd2FyZHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMva29hL2ZvcndhcmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBOzs7OztHQUtHO0FBQ0gsTUFBYSxZQUFZO0lBR3ZCLFlBQVksS0FBa0I7UUFDNUIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDckIsQ0FBQztJQUVELElBQUk7UUFDRixPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDbEQsQ0FBQztDQUNGO0FBVkQsb0NBVUM7QUFDRDs7Ozs7R0FLRztBQUNILFNBQWdCLE1BQU0sQ0FBQyxFQUFlO0lBQ3BDLE9BQU8sSUFBSSxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUZELHdCQUVDIn0=