/* возможно тут следует что-то типа собственного класса query, который будет
в том числе преобразовываться в строку */
class Query {
  constructor (ctx) {
  }
}

exports.init = (ctx, next) => {
  // ctx.query = new Query(ctx);
  return next();
}

exports.pager = (limit) = (ctx, next) => {
    ctx.query.limit || (ctx.query.limit = limit);
    return next();
}
