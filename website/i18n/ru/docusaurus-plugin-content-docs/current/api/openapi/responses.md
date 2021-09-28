---
title: Структуры возвращаемых данных
sidebar_position: 4
---

## Responses

Информация о структуре возвращаемых в методе ответах создается декоратором `@Responses()`. Данный декоратор
позволяет накапливать множество вариантов ответов, если это подразумевается логикой маршрута.

В качестве аргументов принимает последовательность объектов, удовлетворяющих следующей структуре:

```ts
interface OpenApiResponse {
  status: number; // код ответа
  schema: SchemaObject | Function | any; // схема в формате JSON-schema, или объект, генерирующий JSON подходящего формата
  contentType?: string; // тип данных, по умолчанию `application/json`
  isArray?: boolean; // признак того, что возвращается список объектов (коллекция), по умолчанию `false`
  description?: string; // описание ответа
}
```

Пример работы данного декоратора:

```ts
// опишем типовую ошибку, которая может быть возвращена
@JSONSchema({
  description: "standart error response",
})
export class ErrorResponse extends Error {
  @IsNumber()
  @JSONSchema({
    description: "code of error",
    examples: ["404", "500"],
  })
  status: number;

  @IsString()
  @JSONSchema({
    description: "error message",
    examples: ["Not Found", "Access denied"],
  })
  message: string;

  @IsOptional()
  @JSONSchema({
    anyOf: [{ type: "array", items: { type: "object" } }, { type: "object" }],
    description: "error details",
    examples: [
      `[{"property": "name", "error": "must be not empty"}]`,
      `{"errors": ["wrong value", "weak password"]}`,
    ],
  })
  data: any;

  constructor(message, status = 500, data = undefined) {
    super(message);
    this.status = status;
    this.data = data;
  }

  toJSON() {
    return { message: this.message, status: this.status, data: this.data };
  }

  static toJSON(): SchemaObject {
    return targetConstructorToSchema(this);
  }
}

// ... auth.ts
class Auth {
  // на уровне middleware добавим вариант ответа 403, который распространится на все endpoint-ы
  // требующие авторизации
  @Middleware()
  @Responses({ status: 403, description: "access denied error", schema: ErrorResponse })
  static async Required(@Headers("authorization") token, @Err(ErrorResponse) err, @Next() next) {
    const authData = await models.Auth.checkToken(token);
    if (authData) {
      return next();
    } else {
      return err("access denied", 403, { token });
    }
  }
}

// ... users.ts
@Use(Auth.Required)
class Users {
  @Get()
  @Summary("Получить список пользователей")
  @Responses({
    status: 200,
    desciption: "Список пользователей",
    isArray: true,
    schema: models.Users,
  })
  static Index() {
    return models.Users.find();
  }

  @Post()
  @Summary("Добавить пользователя")
  @Responses(
    {
      status: 200,
      description: "Информация о пользователе",
      schema: models.Users,
    },
    { status: 500, description: "Ошибка добавления пользователя", schema: ErrorResponse }
  )
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }
}
```

Таким образом, что для методов маршрутного узла `Users` помимо объявленных для них ответов, будет добавлен
и вариант с ошибкой `403`, так как каждый из этих методов требует прохождения авторизации.
