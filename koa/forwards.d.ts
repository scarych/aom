declare interface FwdContainer<T = any> {
  fn: T;
}
export declare const FwdRef: (fn: () => any) => FwdContainer;
