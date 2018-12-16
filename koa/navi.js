const router = require('./router');

class Navi {
  constructor(prev) {
    this.ident = this.constructor.name;
  }

  $ident(ident) {
    this.last = ident;
    return [this.ident, ident].filter(Boolean).join(Navi.join||'_');
  }

  $href(ident) {
    return router.url(this.$ident(ident));
  }

  $this() {
    return (ctx, next) => {
      ctx.$this = this;
      return next();
    }
  }

  toString() {
    return this.$href();
  }

}

module.exports = Navi ;

/* как раз эта самая navi позволит создавать структуры требуемого вида
так, что они будут естественным образом вплетены в систему вызовов

то есть, это будут методы

this.$navi.tree, this.$navi.stack


*/
