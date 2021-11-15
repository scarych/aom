import { TagObject } from "openapi3-ts";
import * as constants from "../common/constants";
import { Constructor } from "../common/declares";

import { checkConstructorProperty } from "../common/functions";
import { FwdContainer, RouteRefContainer, ThisRefContainer } from "../references";
import {
  OpenApiParameterObject,
  OpenApiPathParameterObject,
  OpenApiPathParameters,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiSecuritySchema,
} from "./types";

function mergeOpenAPIHandlerMetadata({ constructor, property = undefined }, data = {}) {
  const key = constants.OPEN_API_METADATA;
  const openapiMetadata = Reflect.getOwnMetadata(key, constructor, property) || {};
  Object.keys(data).forEach((key) => {
    if (data[key] instanceof Array) {
      const curData = openapiMetadata[key] || [];
      curData.push(...data[key]);
      openapiMetadata[key] = curData;
    } else {
      Object.assign(openapiMetadata, { [key]: data[key] });
    }
  });

  Reflect.defineMetadata(key, openapiMetadata, constructor, property);
}

function standartDecorator(data) {
  return function (constructor, property) {
    checkConstructorProperty(constructor, property);
    // Reflect.defineMetadata(constants.OPEN_API_CONTAINER_METADATA, container, constructor, property);
    mergeOpenAPIHandlerMetadata({ constructor, property }, data);
  };
}

/**
 * Объявить текущую конструкцию тегом
 * @param tag { string | TagObject } имя тега или схема в спецификации OAS
 * @returns {ClassDecorator}
 */
export function AddTag(tag: string | TagObject): ClassDecorator {
  return (constructor) => {
    checkConstructorProperty(constructor);
    // если в качестве тега указано только имя, то используем непосредственно его в качестве схемы
    if (typeof tag === "string") {
      tag = { name: tag };
    }
    // Object.assign(tag, { description: constructor.name }); // описанием тега является имя маршрутного узла
    Reflect.defineMetadata(constants.OPENAPI_TAG, tag, constructor);
  };
}

/**
 * использовать конструкт с тегом
 * @param tag
 * @returns {MethodDecorator}
 */
export function UseTag(tag: Constructor): MethodDecorator {
  // ...
  return standartDecorator({ tag });
}

export function AddSecurity(securitySchema: OpenApiSecuritySchema): ClassDecorator {
  return (constructor) => {
    checkConstructorProperty(constructor);
    Reflect.defineMetadata(constants.OPENAPI_SECURITY, securitySchema, constructor);
  };
}

export function UseSecurity(...security: Constructor[]): MethodDecorator {
  // ...
  return standartDecorator({ security });
}

// значение добавляется только целенаправленно один раз
export function Summary(summary: string): MethodDecorator {
  // ...
  return standartDecorator({ summary });
}

// значение добавляется только целенаправленно один раз
export function Description(description: string): MethodDecorator {
  // ...
  return standartDecorator({ description });
}

export function PathParameters(pathParameters: OpenApiPathParameters): MethodDecorator {
  // ...
  return standartDecorator({ pathParameters });
}

export function QueryParameters(...queryParameters: OpenApiPathParameterObject[]): MethodDecorator {
  // ...
  return standartDecorator({ queryParameters });
}

/** @deprecated decorator should not to be used */
export function Parameters(...parameters: OpenApiParameterObject[]): MethodDecorator {
  // ...
  return standartDecorator({ parameters });
}

export function Responses(...responses: OpenApiResponse[]): MethodDecorator {
  // ...
  return standartDecorator({ responses });
}

export function RequestBody(requestBody: OpenApiRequestBody): MethodDecorator {
  // ...
  return standartDecorator({ requestBody });
}

export function ReplaceNextTags(): MethodDecorator {
  return standartDecorator({
    nextTagRule: constants.NEXT_TAGS_REPLACE,
  });
}

export function IgnoreNextTags(): MethodDecorator {
  return standartDecorator({ nextTagRule: constants.NEXT_TAGS_IGNORE });
}

export function MergeNextTags(): MethodDecorator {
  return standartDecorator({ nextTagRule: constants.NEXT_TAGS_MERGE });
}

export function DelayRefStack(
  handler: FwdContainer | ThisRefContainer | RouteRefContainer
): MethodDecorator {
  return function (constructor, property) {
    checkConstructorProperty(constructor, property);

    Reflect.defineMetadata(constants.DELAYED_STACK_HANDLER, handler, constructor, property);
  };
}
