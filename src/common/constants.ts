export const CONTROLLER_NODE = "aom:controller_node";
export const BRIDGE_METADATA = "aom:bridge";
export const MARKERS_METADATA = "aom:marker";
export const IS_STICKER_METADATA = "aom:is_sticker";
export const MIDDLEWARE_METADATA = "aom:middleware";
export const MIDDLEWARES_LIST_METADATA = "aom:middlewares_storage";
export const IS_MIDDLEWARE_METADATA = "aom:is_middleware";
export const ENDPOINTS_METADATA = "aom:endpoints";
export const IS_ENDPOINT = "aom:is_endpoint";
export const COMMON_ENDPOINT = "aom:common_endpoint";
export const IS_ENDPOINTS_LIST = "aom:is_endpoints_list";
export const COMMON_ENDPOINTS_LIST = "aom:common_endpoints_list";
export const PARAMETERS_METADATA = "aom:parameters";
export const IS_CONTEXT_CONTAINER = "aom:context_container";
export const REVERSE_METADATA = "aom:reverse_link";
export const USE_NEXT_METADATA = "aom:use_next_endpoint";
export const ERROR_METADATA = "aom:error_result";
export const OPEN_API_METADATA = "aom:open_api_meta";
export const OPEN_API_CONTAINER_METADATA = "aom:open_api_container";
export const COMMON_ENDPOINT_ERROR =
  "Wrong endpoint! The handler hasn't marked with `@Endpoint()` decorator";
export const CONSTRUCTOR_TYPE_ERROR = "Wrong target type! The decorator allowed for class only";
export const CONSTRUCTOR_PROPERTY_TYPE_ERROR =
  "Wrong target type! The decorator allowed for static methods only";
export const IS_MIDDLEWARE_ERROR = "Wrong middleware! The handler isn't marked as middleware";
export const USE_NEXT_DEFINE_ERROR = "Next function already defined for property!";
export const USE_NEXT_ERROR = "Wrong next function! The handler isn't marked as endpoint";
export const ERROR_CONSTRUCTOR_ERROR =
  "Wrong error decorator argument! The constructor must be `class extends  Error`";
export const PARAMETER_HANDLER_ERROR = "Wrong handler for parameter decorator!";

export const OPENAPI_INSTANCE_ERROR = "Wrong instance for OpenApi documentation container!";
export const OPENAPI_TAG = "aom:openapi_tag_schema";
export const OPENAPI_SECURITY = "aom:openapi_security_schema";
export const NEXT_TAGS_REPLACE = "aom:next_tags_replace";
export const NEXT_TAGS_IGNORE = "aom:next_tags_ignore";
export const NEXT_TAGS_MERGE = "aom:next_tags_merge";
export const DELAYED_STACK_HANDLER = "aom:delayed_stack_handler";

export const MONGO_QUERY_FIELDS = "aom:mongo_query_fields";
export const MONGO_QUERY_FIELDS_TYPE_ERROR = "Property type is not defined!";
export const MONGO_JOIN_FIELDS = "aom:mongo_join_fields";
export const MONGO_JOIN_FIELDS_ERROR =
  "Wrong relation! The argument relation must be database model";

export const DISPLAY_NAME = "aom:display_name";
export const DISPLAY_NAME_ERROR = "Wrong display name! The value is already used!";
