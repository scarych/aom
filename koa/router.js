const koaRouter = require('koa-router');
const bridge = require('koa-router-bridge');

module.exports =  bridge(koaRouter);
