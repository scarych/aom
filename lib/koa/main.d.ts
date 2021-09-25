import { HandlerFunction, IRoute } from "../common/declares";
import { OpenApi } from "../openapi";
export declare class $ {
    routes: IRoute[];
    constructor(root: any, prefix?: string);
    eachRoute(handler: HandlerFunction): this;
    docs(docsContainer: OpenApi): this;
}
