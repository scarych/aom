import { TagObject } from "openapi3-ts";
import * as constants from "../common/constants";
import { Constructor, StaticMethodDecorator } from "../common/declares";

import { checkConstructorProperty } from "../common/functions";
import {
  OpenApiParameterObject,
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
    Reflect.defineMetadata(constants.OPENAPI_TAG, tag, constructor);
  };
}

/**
 * использовать конструкт с тегом
 * @param tag
 * @returns {StaticMethodDecorator}
 */
export function UseTag(tag: Constructor): StaticMethodDecorator {
  // ...
  return standartDecorator({ tag });
}

export function AddSecurity(securitySchema: OpenApiSecuritySchema): ClassDecorator {
  return (constructor) => {
    checkConstructorProperty(constructor);
    Reflect.defineMetadata(constants.OPENAPI_SECURITY, securitySchema, constructor);
  };
}

export function UseSecurity(...security: Constructor[]) {
  // ...
  return standartDecorator({ security });
}

// значение добавляется только целенаправленно один раз
export function Summary(summary: string): StaticMethodDecorator {
  // ...
  return standartDecorator({ summary });
}

// значение добавляется только целенаправленно один раз
export function Description(description: string) {
  // ...
  return standartDecorator({ description });
}

export function PathParameters(pathParameters: OpenApiPathParameters) {
  // ...
  return standartDecorator({ pathParameters });
}

export function Parameters(...parameters: OpenApiParameterObject[]) {
  // ...
  return standartDecorator({ parameters });
}

export function Responses(...responses: OpenApiResponse[]): StaticMethodDecorator {
  // ...
  return standartDecorator({ responses });
}

export function RequestBody(requestBody: OpenApiRequestBody): StaticMethodDecorator {
  // ...
  return standartDecorator({ requestBody });
}

export function ReplaceNextTags(): StaticMethodDecorator {
  return standartDecorator({
    nextTagRule: constants.NEXT_TAGS_REPLACE,
  });
}

export function IgnoreNextTags(): StaticMethodDecorator {
  return standartDecorator({ nextTagRule: constants.NEXT_TAGS_IGNORE });
}

export function MergeNextTags(): StaticMethodDecorator {
  return standartDecorator({ nextTagRule: constants.NEXT_TAGS_MERGE });
}