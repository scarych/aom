const router = require('./router');
const _ = require('lodash');

class Navi {
  constructor(parent = {}) {
    this.$parent = parent;
    const {$router = router, $root} = parent;
    this.$router = $router;
    this.$root = $root;
    this.ident = this.constructor.name;
  }

  $ident(ident) {
    this.last = ident;
    return [this.ident, ident].filter(Boolean).join(Navi.join||'_');
  }

  $href(ident, params) {
    ident = this.$ident(ident);
    const url = this.$router.url(ident);
    if (_.isError(url)) {
      return '#'+ident;
    } else {
      return url;
    }
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
