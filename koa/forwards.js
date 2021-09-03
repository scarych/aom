"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

class FwdContainer {
  fn;

  constructor(fn) {
    this.fn = fn;
  }

  exec() {
    return Reflect.apply(this.fn, null, []);
  }
}

exports.FwdContainer = FwdContainer;

function FwdRef(fn) {
  return new FwdContainer(fn);
}
exports.FwdRef = FwdRef;
