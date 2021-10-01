import { ThisRefFunction, IFwdContainer } from "../common/declares";
export declare class ThisRefContainer implements IFwdContainer {
    fwdFn: ThisRefFunction;
    constructor(fwdFn: ThisRefFunction);
    exec(constructor: any): any;
}
export declare function ThisRef(handler: ThisRefFunction): ThisRefContainer;
