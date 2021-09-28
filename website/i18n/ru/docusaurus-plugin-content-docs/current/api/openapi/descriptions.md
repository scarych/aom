---
title: Описание для точек маршрута
sidebar_position: 1
---

## Summary и Description

Для описания конечной точки маршрута используются декораторы `@Summary()` и `@Description()`. Каждый из них
принимает в качестве аргумента строковое значение.

```ts
import { Summary, Description } from "aom";
import { Get, Post } from "aom";

class Users {
  @Summary("Список пользователей")
  @Description("Возвращает список активных пользователей")
  @Get()
  static List() {
    return models.Users.find({ active: true });
  }

  @Summary("Добавить пользователя")
  @Description("Создает нового пользователя и возвращает информацию о нем")
  @Post()
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }
}
```

Описание метода не является накопительной информацией, и используется целенаправленно для каждой конечной
точки маршрута.
