import { FwdFunction, IFwdContainer } from "../common/declares";
/**
 * forward-контейнер для проброски значений из циклических зависимых модулей
 * @property fwdFn хранимая forward-функция, которая извлекается в момент построения конструкта
 *
 * @method exec - выполнение forward-функции и возврат хранимого значения
 */
export declare class FwdContainer implements IFwdContainer {
    fwdFn: FwdFunction;
    constructor(fwdFn: FwdFunction);
    exec(): any;
}
/**
 * создает Forward-контейнер вокруг аргумента, позволяет избежать проблемы
 * циклической зависимости модулей
 * @param fwdFn функция-обертка вокруг маршрутного узла или мидллвари
 * @returns {new FwdContainer}
 */
export declare function FwdRef(fn: FwdFunction): FwdContainer;
