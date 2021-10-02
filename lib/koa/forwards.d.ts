import { FwdFunction, IFwdContainer } from "../common/declares";
export declare class FwdContainer implements IFwdContainer {
    fwdFn: FwdFunction;
    constructor(fwdFn: FwdFunction);
    exec(): any;
}
export declare function FwdRef(fn: FwdFunction): FwdContainer;
