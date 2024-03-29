import { ThisRefFunction, IFwdContainer } from "../common/declares";

const _default = (arg) => arg;
export class ThisRefContainer implements IFwdContainer {
  fwdFn: ThisRefFunction;

  constructor(fwdFn: ThisRefFunction) {
    this.fwdFn = fwdFn;
  }

  exec(constructor) {
    return Reflect.apply(this.fwdFn, constructor, [constructor]);
  }
}

export function ThisRef(handler: ThisRefFunction = _default): ThisRefContainer {
  return new ThisRefContainer(handler);
}
