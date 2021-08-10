import { OpenApi } from "../openapi";

type routeElem = { method: string; path: string; middlewares: Function[] };
type routesHandler = (route: routeElem) => void;
type routesList = routeElem[];
export declare class $ {
  constructor(target: Function, prefix?: string);
  routes(handler: routesHandler): $;
  routes(): routesList;
  docs(docs: OpenApi): $;
}

// export declare function $(target: typeof Function, prefix?: string, docs?: OpenApi): Function;
