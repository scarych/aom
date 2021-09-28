---
title: Протоколы безопасности
sidebar_position: 6
---

## AddSecurity и UseSecurity

Для добавления информации о протоколах безопасности используется декоратор `@AddSecurity`, применяемый
к классу - маршрутному узлу, создающему слой данных, требующих выполнение данного протокола.

Декоратор `@AddSecurity` принимает в качестве аргумента объект, отвечающий структуре `SecuritySchemeObject`
из библиотеки `openapi3-ts`, и соответствующий описанию
[`Security Scheme Object`](https://swagger.io/specification/#security-scheme-object) в документации.

Для подключения созданного протокола безопасности, необходимо на `middleware`-функцию, после которой
начинают действовать указанные правила, добавить декоратор `@UseSecurity`, передав в качестве аргумента
класс, который инициирует данный протокол.

Пример:

```ts
// опишем схему, которая соответствует авторизации по bearer токену
const BearerSecuritySchema = {
  type: "http",
  in: "header",
  name: "Authorization",
  scheme: "bearer",
};

// определим, что "носителем" протокола является класс `Auth`
@AddSecurity(BearerSecuritySchema)
export class Auth {
  user: models.Users;
  // ...
  @Post()
  @Summary("Авторизация по логину/паролю")
  @Responses(
    { status: 200, description: "Успешная авторизация", schema: models.Token },
    { status: 500, description: "Ошибка авторизации", schema: ErrorResponse }
  )
  @RequestBody({ description: "Логин/пароль", schema: AuthForm })
  static async Login(@Body() { login, password }, @Next() next, @Err() err) {
    const authData = await models.Auth.checkAuth(login, password);
    if (models.Auth) {
      const token = await models.Token.generateToken(authData);
      return token;
    } else {
      return err("Неверные авторизационные данные");
    }
  }

  // создадим прослойку, которая требует валидный токен для дальнейших действий
  @Middleware()
  @UseSecurity(Auth) // укажем, какой протокол безопасности используется
  @Responses({ status: 403, description: "Доступ запрещен", schema: ErrorResponse })
  static async Required(
    @Headers("authorization") token,
    @This() _this: Auth,
    @Next() next,
    @Err() err
  ) {
    const authData = await models.Tokens.checkAuth(token);
    if (authData) {
      _this.user = await models.Users.findById(authData.userId);
      return next();
    } else {
      return err("Неверные авторизационные данные");
    }
  }
}

// ... root.ts

@Bridge("/auth", Auth)
@Bridge("/account", Account)
class Root {
  // ...
}
// .. account.ts
// все методы в маршрутном узле Account требуют авторизации
// и на них распространяется схема безопасности BearerToken, соответствующая классу Auth
@Use(Auth.Required)
class Account {
  //...
  @Get()
  static Info(@StateMap(Auth) { user }: Auth) {
    const stats = await user.getStats();
    return { user, stats };
  }
}
```

**Важно**: в настоящее время не реализована полноценная поддержка протокола `OAuth`, подразумевающая
наличие специфических разрешений на чтение/запись/удаление.
