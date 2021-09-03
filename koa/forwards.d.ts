declare interface FwdContainer<T = any> extends Function {
  fn: T;
}
export declare const FwdRef: (fn: () => any) => FwdContainer;
