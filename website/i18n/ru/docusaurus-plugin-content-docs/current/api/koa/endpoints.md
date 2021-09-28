---
title: Точки назначения (endpoint)
sidebar_position: 2
---

# Конечные точки маршрута

Все `endpoint`-ы создаются при помощи декораторов из следующего списка:

- `@Endpoint(url, method = 'get'|'post'|'put'|'patch'|'delete'|'options'|'all')` - указывает,
  что создается `endpoint`, указывающий на адрес `url`, и доступный через метод `method`. По умолчанию
  `url='/'`, `method='get'`.
- `@Get(url)` - сокращение для `@Endpoint(url, 'get')`
- `@Post(url)` - сокращение для `@Endpoint(url, 'post')`
- `@Put(url)` - сокращение для `@Endpoint(url, 'put')`
- `@Patch(url)` - сокращение для `@Endpoint(url, 'patch')`
- `@Delete(url)` - сокращение для `@Endpoint(url, 'delete')`
- `@Options(url)` - сокращение для `@Endpoint(url, 'options')`
- `@All(url)` - сокращение для `@Endpoint(url, 'all')`

Значение `url` может иметь несколько уровней вложенности, и даже содержать типовой `koa-router`-параметр.
В качестве значения ссылки используется фрагмент адреса, который характеризует данный метод исключительно
в пределах данного маршрутного узла. Полное имя адреса будет построено на основании всех связей,
которые предшествовали данному `endpoint`-у.

Указанные декораторы применяются следующим образом:

```ts
// ... index.ts
import { Get, Post, Body } from "aom";

class Index {
  @Get()
  static Hello() {
    return `Hello, I'm aom`;
  }

  @Post("/save")
  static Save(@Body() body: any) {
    return body;
  }

  @Get("/choose/:variant")
  static Variant(@Params("variant") variant) {
    return { variant };
  }
}
```

Таким образом будет создан маршрутный элемент, обладающий методами: `GET /`, `POST /save` и
`GET /choose/:variant`, который, после подключения в маршрутную карту, предоставит к ним доступ
с учетом возможных префиксов.