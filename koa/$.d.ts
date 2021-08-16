import { OpenApi } from "../openapi";
import { IRoute } from "./decorators";

type routeElem = { method: string; path: string; callstack: Function[] };
type routesHandler = (route: routeElem) => void;
type routesList = routeElem[];
export declare class $ {
  routes: IRoute[];
  constructor(target: Function, prefix?: string);
  eachRoute(handler: routesHandler): $;
  docs(docs: OpenApi): $;
}

// export declare function $(target: typeof Function, prefix?: string, docs?: OpenApi): Function;
