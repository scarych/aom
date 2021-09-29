import { Constructor, IRoute } from "../common/declares";
export declare class OpenApi {
    mergeSeparator: string;
    data: {
        openapi: string;
    };
    constructor(initData?: {});
    tagsSet: Set<unknown>;
    tagsMap: Map<any, any>;
    securitySet: Set<unknown>;
    securityMap: Map<any, any>;
    paths: {};
    registerPath(route: IRoute): void;
    Data(data: any): this;
    mergeAndExtractTags(tagsKeys?: any[]): any[];
    buildResponses(responses: any): {};
    buildRequestBody(requestBody: any): {};
    toJSON(): {
        definitions: Record<string, Constructor>;
        components: {
            tags: any[];
            securitySchemes: {};
        };
        paths: {};
        openapi: string;
    };
}
