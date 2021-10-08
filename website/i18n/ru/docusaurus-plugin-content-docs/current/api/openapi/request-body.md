---
title: Входящие запросы
sidebar_position: 4.5
---

## RequestBody

Декоратор `@RequestBody` позволяет добавить описание для структуры данных, передаваемой в методах
`post`/`put`/`patch`.

Декоратор принимает аргумент, имеющую структуру:

```ts
interface OpenApiRequestBody {
  description: string; // описание
  contentType?: string; // тип данных, по умолчанию application/json
  schema: SchemaObject | ThisRefContainer | Function | any; // схема данных, удовлетворяющая спецификации OAS
}
```

Применяется исключительно для конечной точки маршрута, добавляет соответствующее значение в структуру
`requestBody` соответствующего метода.

Пример использования:

```ts
//

class AuthForm extends toJSONSchema {
  @IsString()
  @JSONSchema({
    description: "auth login value",
    example: "user127",
  })
  login: string;

  @IsString()
  @JSONSchema({
    description: "auth password value",
    format: "password",
  })
  password: string;
}
class Auth {
  @Summary("Авторизация пользователя")
  @Description("Ожидает логин/пароль для авторизации. Возвращает токен")
  @RequestBody({ description: "Авторизационные данные", schema: AuthForm })
  @Responses({ status: 200, description: "Bearer токен для входа", schema: models.Tokens })
  @Post()
  static Login(@Body() { login, password }) {
    // ... login process
  }
}
```

При загрузке файлов следует использовать корректный `contentType` с описанием ожидаемых полей данных.

```ts
class Files {
  @Post("/upload")
  @RequestBody({
    description: "файл для загрузки",
    contentType: "multipart/form-data",
    schema: {
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Summary("Загрузка файла")
  @Responses({ status: 200, description: "Информация о загруженном файле", schema: models.Files })
  static Upload(@Files("file") file: File) {
    // ...
  }
}
```
