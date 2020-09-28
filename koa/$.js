const _ = require('lodash');

class $ {

  constructor(parent = {}, data = {}) {
    const ident = this.constructor.name;
    this.$ = _.merge({ parent, ident, tree: [], struct: {} }, data);
    const { root = this } = parent.$;
    // set this in tree of parent (store full relation for complete navigation)
    _.isArray(parent.$.tree) && (parent.$.tree.push(this));
    this.$.root = root;
    root.$.struct[this.$ident()] = this;
  }

  /** generate ident based on current element ident */
  $ident(ident) {
    this.$.last = ident
    return [
      this.$.parent && this.$.parent.$ident
        ? this.$.parent.$ident(this.$.ident)
        : this.$.ident, ident
    ].filter(Boolean).join($.$delimeter);
  }
}

//
$.$delimeter = '.';

module.exports = $;
