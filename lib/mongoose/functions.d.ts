export declare function QueryParse(constructor: any, query: any): {
    $and: {}[];
    $lookups: any[];
    $navigation: any[];
    $groups: any[];
};
export declare function QueryMap(constructor: any): any[];
export declare function QuerySchema(constructor: any): {
    name: string;
    in: string;
    required: boolean;
    description: string;
    schema: {
        type: string;
    };
}[];
