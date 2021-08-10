import { OpenApi } from "../openapi";

type routesHandler = (method: string, path: string, routes: Function[]) => void;
type routeElem = { method: string; path: string; routes: Function[] };
type routesList = routeElem[];
export declare class $ {
  constructor(target: Function, prefix?: string);
  routes(handler: routesHandler): $;
  routes(): routesList;
  docs(docs: OpenApi): $;
}

// export declare function $(target: typeof Function, prefix?: string, docs?: OpenApi): Function;
