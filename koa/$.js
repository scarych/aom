"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const { buildRoutesList } = require("./helpers");

function $(constructor, prefix = "/") {
  return (router) => {
    const routesList = buildRoutesList(constructor, prefix);
    routesList.forEach((routeData) => {
      const { method, path, exec } = routeData;
      router[method](path, ...exec(routesList));
    });
    return router;
  };
}

exports.$ = $;
