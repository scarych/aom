const _ = require('lodash');

class $ {
  constructor(parent = {}) {
    const ident = this.constructor.name;
    this.$ = { parent, ident };
    const { router, root = this } = parent.$;
    this.$.router = router;
    this.$.root = root;
  }

  $id({_id}, params = {}) {
    const { id } = this;
    if (id && _id) {
      params[id] = _id;
    }
    return params;
  }

  $ident(ident) {
    return [this.$.ident, ident].filter(Boolean).join('');
  }

  $url(ident, params={}) {
    ident = this.$ident(ident);
    const url = this.$.router.url(ident, params);
    if (_.isError(url)) {
      return '#'+ident;
    } else {
      return url;
    }
  }

  $last() {
    return (ctx, next) => {
      const { state, url } = ctx;
      state.$last = url;
      return next();
    }
  }
  
  $this() {
    return (ctx, next) => {
      ctx.$this = this;
      return next();
    }
  }

  toString() {
    return this.$url();
  }

}

module.exports = $ ;

/* как раз эта самая navi позволит создавать структуры требуемого вида
так, что они будут естественным образом вплетены в систему вызовов

то есть, это будут методы

this.$navi.tree, this.$navi.stack


*/
