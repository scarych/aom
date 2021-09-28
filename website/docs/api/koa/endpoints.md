---
title: Endpoints decorators
sidebar_position: 2
---

## The routes endpoints

All endpoints are created using decorators from the following list:

- `@Endpoint(url, method = 'get'|'post'|'put'|'patch'|'delete'|'options'|'all')` - creates
  `endpoint`, pointing to the address `url` on the `method` method. Default: `url='/'`, `method='get'`.
- `@Get(url)` - shortcut for `@Endpoint(url, 'get')`
- `@Post(url)` - shortcut for `@Endpoint(url, 'post')`
- `@Put(url)` - shortcut for `@Endpoint(url, 'put')`
- `@Patch(url)` - shortcut for `@Endpoint(url, 'patch')`
- `@Delete(url)` - shortcut for `@Endpoint(url, 'delete')`
- `@Options(url)` - shortcut for `@Endpoint(url, 'options')`
- `@All(url)` - shortcut for `@Endpoint(url, 'all')`

The `url` value can have several levels of nesting, and even contain a typical `koa-router` parameter.
As the value of the link, a fragment of the address is used, which characterizes this method exclusively
within the given route node. The full name of the address will be built based on all links,
which preceded the given `endpoint`.

The specified decorators are applied as follows:

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

This will create a route node with methods: `GET /`, `POST /save` and `GET /choose/:variant`,
which, after connecting to the route map, will provide access to them using the declared prefixes.


## Common endpoints