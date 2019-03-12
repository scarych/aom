const _  = require('lodash');

exports.$ = require('./$');
exports.access = require('./access');
// exports.query = require('./body');

exports.router = require('./router');

const query = require('./query');
exports.query = query.init;

exports.params = (ctx, next) => {
    return next();
}

exports.i18n = (ctx, next) => {
    return next();
}

exports.body = (ctx, next) => {
    return next();
}

exports.init = ({ limit = 25, glob = '__' }) => (ctx, next) => {
    return next();
}
/**  apply render (if posseible) by specific `template` for related ctx */
exports.render = (template) => {
  return (ctx, next) => {
    _.isFunction(ctx.render) && ctx.render(template);
    return next();
  }
}

/*
необходима возможность сохранять
идентификаторы на роутерах по принципу

identy('/', router.post, [...stack] );
либо
identy({'/search':'SurveysSearch'}, router.post, [...stack] );
и в stack сразу добавлялось в начало ctx.state.lastIdent = ...
и всегда можно было вызвать {{path()}}, которая по умолчанию
будет использовать lastIdent


*/
