export declare function buildRoutesList(
  constructor: Function,
  prefix?: string,
  middlewares?: Function[]
): Function;

export declare function saveStorageMetadata(
  constructor: Function,
  metakey: string,
  metadata: any,
  storageKeys: any[],
  push?: Boolean,
  pushIndex?: number
): void;
