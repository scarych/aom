import { ThisRefFunction, IFwdContainer } from "../common/declares";

const _default = (arg) => arg;

export class RouteRefContainer implements IFwdContainer {
  fwdFn: ThisRefFunction;

  constructor(fwdFn: ThisRefFunction) {
    this.fwdFn = fwdFn;
  }

  exec(constructor) {
    return Reflect.apply(this.fwdFn, constructor, [constructor]);
  }
}

export function RouteRef(handler: ThisRefFunction = _default): RouteRefContainer {
  return new RouteRefContainer(handler);
}
