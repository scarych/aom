
exports.pager = (limit) = (ctx, next) => {
    ctx.query.limit || (ctx.query.limit = limit);
    return next();
}
