const _ = require('lodash');

class $ {
  constructor(parent = {}) {
    const ident = this.constructor.name;
    this.$ = { parent, ident, tree:{}};
    const { router, root = this } = parent.$;
    // set this in tree of parent (store full relation for complete navigation)
    parent.$.tree && (parent.$.tree[ident] = this); 
    this.$.router = router;
    this.$.root = root;

  }

  /** use current id to generate params  {'some_id':_id } 
   * for case $url(ident, $this.$id(User)) in templates
  */
  $id({_id}, params = {}) {
    const { id } = this;
    if (id && _id) {
      params[id] = _id;
    }
    return params;
  }
  /** return list of parents for current object to make breadcrumbs visuals */
  $tree(tree=[]) {
    tree.unshift(this);
    if (this.$.parent.$tree) {
      return this.$.parent.$tree(tree);
    }
    return tree;
  }
  /** generate ident based on current element ident */
  $ident(ident) {
    return [this.$.parent && this.$.parent.$ident ? this.$.parent.$ident(this.$.ident) : this.$.ident, ident].filter(Boolean).join('');
  }
  /** generate url for specific ident with related router */
  $url(ident, params={}) {
    ident = this.$ident(ident);
    const url = this.$.router.url(ident, params);
    if (_.isError(url)) {
      return '#'+ident;
    } else {
      return url;
    }
  }
  
  /** attach this object to content $this */  
  $this() {
    return (ctx, next) => {
      ctx.$this = this;
      return next();
    }
  }

  /** make redirect action for current ctx 
   * 
  */
  $redirect(ident, attr) {
    attr = attr || this.id.substr(0, this.id.length - statics._id.length);
    return (ctx, next) => {
      ctx.redirect(this.$url(ident, this.$id(ctx.state[attr])));
      return next();
    }
  }
  
  /** add this value to named ctx.state or push into list
   *  case depends on type of input data string or array
   */
  $state() {
    const attrs = _.values(arguments);
    return (ctx, next) => {
      attrs.map(attr => {
        if (_.isString(attr)) {
          ctx.state[attr] = this;
        } else if (_.isArray(attr)) {
          attr.map(attr => {
            _.isArray(ctx.state[attr]) && ctx.state[attr].push(this);
          })
        }
      });
      return next();
    }
  }
  
  /** return current url in string value */
  toString() {
    return this.$url();
  }

}

module.exports = $ ;
