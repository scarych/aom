---
title: Endpoints decorators
sidebar_position: 2
---

## The routes endpoints

All endpoints are created using decorators from the following list:

- `@Endpoint(path, method = 'get'|'post'|'put'|'patch'|'delete'|'options'|'all')` - creates
  `endpoint`, pointing to the address `path` on the `method` method. To create an endpoint via
  this decorator, you must specify at least the method to be used. Calling this decorator
  without arguments creates a common endpoint (more details below). Default: `path='/'`.
- `@Get(path)` - shortcut for `@Endpoint(path, 'get')`
- `@Post(path)` - shortcut for `@Endpoint(path, 'post')`
- `@Put(path)` - shortcut for `@Endpoint(path, 'put')`
- `@Patch(path)` - shortcut for `@Endpoint(path, 'patch')`
- `@Delete(path)` - shortcut for `@Endpoint(path, 'delete')`
- `@Options(path)` - shortcut for `@Endpoint(path, 'options')`
- `@All(path)` - shortcut for `@Endpoint(path, 'all')`

All shortcuts decorators are applied over static class methods without a second argument.
The use of the second argument applies only to common endpoints (described below), and
is used as class decorators.

The `path` value can have several levels of nesting, and even contain a typical `koa-router` parameter.
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

`aom` allows you to create common endpoints, allowing you to reuse the same code in different
places at a different access address and, if necessary, in a different method.

To declare a class method as a common endpoint, use the `@Endpoint()` decorator with no arguments.
Then this method can be used as the second argument for the shortcut decorators applied to the
class in which you want to use these methods.

Example:

```ts
// let's create two common endpoints that use the value of the data model from the context state
class Data {
  @Endpoint()
  static List(@State() { model }, @Query() query) {
    return model.find({ ...query });
  }

  @Endpoint()
  static Add(@State() { model }, @Body() body) {
    return model.create({ ...body });
  }
}

// create a route node in which the `Users` data model will be declared upon initiation
// and connect the previously declared destination points to it by the specified path and methods
@Use(Users.Init)
@Get("/", Data.List)
@Post("/", Data.Add)
class Users {
  model = models.Users;

  @Middleware()
  static Init(@State() state, @This() { model }: Users, @Next() next) {
    Object.assign(state, { model });
    return next();
  }
}

// create a route node in which the `Customers` data model will be declared upon initiation
// and connect the previously declared destination points to it by the specified path and methods
@Use(Customers.Init)
@Get("/", Data.List)
@Post("/", Data.Add)
class Customers {
  model = models.Customers;

  @Middleware()
  static Init(@State() state, @This() { model }: Users, @Next() next) {
    Object.assign(state, { model });
    return next();
  }
}
```

Only methods that were invoked as "common" decorators can be used as the second argument for
the `Get`/`Post`/`Put`/`Patch`/ `Options`/`Delete`/`All` decorators. Otherwise, the build will
throw an error.

**Important!** The context of "common" endpoints is the class in which they are declared: that is,
the default `@This` decorator will use its own class (in the example, `Data`), and the
return value of the `@Route()` with different calls will differ only in the values of `path` and `method`.
