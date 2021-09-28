---
title: Bridges and Middlewares
sidebar_position: 3
---

## Bridges and Middlewares

Middleware layers are created using the `@Middleware()` decorator. It takes no arguments, and
simply allows the specified method to be used as an intermediate layer to any other element of
the route node: an endpoint, bridge, other middleware, or the entire route node.

Connection of `middleware` is done using the decorator `@Use()`, which takes as arguments
a sequence of `middleware`-functions: `@Use (Root.Init, Auth.Required, Users.Init)`.

The `@Use()` decorator can be applied to an endpoint, an entire route node, another middleware, or a bridge.
All middlewares are always executed before the element to which they are applied.

To connect route elements to each other use the `@Bridge` decorator.

The arguments to the decorator are:

- `prefix: string` - route address prefix, may contain a parameter contextual to the target route element
- `nextRoute: Function` - next route node: a decorated class that can contain other bridges, middlewares, and endpoints

The `@Bridge` decorator can be applied to a class or a static class method. In the second case, the
class method acts as a middleware to the route node being connected.

Example:

```ts
// ... index.ts
import { Get, Bridge, Use, Middleware } from "aom";
import logger from "logger";
import Files from "./files";

@Bridge("/files", Files) // the Files route node is accessible by the `/files` prefix relative to the current node
class Index {
  @Get()
  @Use(Root.Logger) // before the `GET /` method, a middleware with logging will be used
  static Hello() {
    return `Hello, I'm aom`;
  }

  @Middleware()
  static Logger(@Ctx() ctx, @Next() next) {
    logger.debug(ctx);
    return next();
  }
}

// Files.ts
import fs from "fs";
import path from "path";
import { Get, Bridge, Params, StateMap, Next, Err } from "aom";
import FileInfo from "./fileinfo";

class Files {
  @Get()
  static Index() {
    return fs.readdirSync(__dirname);
  }

  @Bridge("/:filename", FileInfo) // expects a parameter - filename - as the next chunk of the path
  static prepare(
    @Params("filename") filename: string,
    @StateMap() stateMap: WeakMap<any, any>,
    @Err() err,
    @Next() next
  ) {
    // get the full name of the file, using the directory name
    filename = path.join(__dirname, filename);
    // if file exists
    if (fs.existsSync(filename)) {
      // make and instance of connected class
      const fileInfo = new FileInfo();
      // save the filename
      fileInfo.filename = filename;
      // save the instance to StateMap
      stateMap.set(FileInfo, fileInfo);
      return next();
    } else {
      return err("file not found", 404, [filename]);
    }
  }
}

// ... fileinfo.ts
import getFileInfo from "get-file-info";
import fs from "fs";

@Use(FileInfo.Init) // before all node methods, the `FileInfo.Init` middleware is executed
class FileInfo {
  filename: string; // full filename
  info: any; // file info

  @Get()
  static Index(@Ctx() ctx, @This() _this: FileInfo) {
    // set the content type according to the mime-type of the file
    ctx.set("Content-Type", _this.info.type);
    return fs.readFileSync(_this.filename);
  }

  @Delete()
  static Delete(@This() { filename }: FileInfo) {
    fs.unlinkSync(filename);
    return `file ${filename} successfully removed`;
  }

  @Middleware()
  static Init(@This() _this: FileInfo, @Next() next) {
    // since it is known for sure that this file exists
    // then we get information about it without checking for errors
    _this.info = getFileInfo(_this.filename);
    return next();
  }
}
```

The bridge can be connected with the `/` prefix: in this case, all methods of the connected node
will be located in the prefix-space of the node to which the connection is made.

**Important**: during assembly, all bridges are connected after the `endpoints` of the current route node.
Thus, if a collision suddenly occurs in the values of `url` and/or `prefix`, the priority will remain
with the methods connected last, that is, via `@Bridge`. The developer is obliged to independently
monitor the address space, which he or she uses.

## Marker

The `@Marker()` decorator allows you to enrich the information about the destination in the route map,
specifying that for the `route` element in the chain of `middleware` preceding it there are `cursor`
elements with certain `prefix` values, to which some special logic applied.

The decorator is applied to the `middleware`-function, so that the moment this middleware is used
in any part of the route map, the marker is applied to the endpoint according to the rules of the
marking function.

The `@Marker()` decorator accepts a mark function as an argument, which must take two arguments:
`route` and `cursor`. The cursor will always be the middleware to which the `@Marker` decorator is applied

Marking is set in the process of assembling a route map and does not operate with context. The
presence of a marking in a route element can serve as a basis for additional contextual checks:
authority roles, access rights, and other compound operations.

Let's consider the use of markings using the example of access control to waypoints.

```ts
// for checking access rights, is used a data model that store the final and intermediate sections
// of the route with an indication of the roles that these rights are allowed
// users can have one or more roles that allow him to access different methods
class Access {
  // a middleware that checks that a user authorized in the context is allowed access
  // to this segment of the route
  @Middleware()
  // define that this layer is a `@Marker` using the specific marking function
  @Marker(Access.setMark)
  static Check(
    @StateMap(Auth) { user }: Auth, // user credentials
    @Route() route, // endpoint from which it is important to know `path` and `method` values
    @Cursor() cursor, // cursor from which it is important to know `prefix` value
    @Next() next,
    @Err() err
  ) {
    // if a check is performed for the user, then let him pass this layer leading to the specific endpoint
    if (user.checkAccess(route, cursor)) {
      return next();
    } else {
      // otherwise we will return a 403 error
      return err("access denied", 403);
    }
  }

  // define the marker name
  static markerName = "check_access";
  // marking funciton
  static setMark(route: IRoute, cursor: ICursor) {
    const { markerName } = this;
    // if there is no required marker for the `route` element, then create it
    if (!route[markerName]) {
      route[markerName] = [];
    }
    // add the current cursor to the list for route
    route[markerName].push(cursor);
  }
}
// ... apply the created marker
// ...

import { $aom } from "./server";

@Bridge("/users", Users)
class Root {
  @Get()
  static Index() {
    return $aom.routes;
  }

  @Get("/info")
  // apply middleware that performs the marking function
  // marking will propagate to the `Root.Secure` method
  @Use(Access.Check)
  static Secure() {
    return "this route is secure";
  }
}
// apply middleware that performs the labeling function
// marking will apply to all methods of the `Users` route node
@Use(Access.Check)
class Users {
  @Get()
  static Index() {
    return models.Users.find();
  }

  @Post("/add")
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }

  @Delete("/:user_id")
  @Use(Access.Check)
  static Delete(@Params() { user_id }) {
    return models.Users.remove({ _id: user_id });
  }
}
```

As a result of this operation, the following values will appear in the list of `routes`

```ts
[
  {
    method: "get",
    path: "/",
  },
  {
    method: "get",
    path: "/secure",
    check_access: [{ prefix: "/secure" }],
  },
  {
    method: "get",
    path: "/users",
    check_access: [{ prefix: "/users" }],
  },
  {
    method: "delete",
    path: "/users/:user_id",
    check_access: [{ prefix: "/users" }, { prefix: "/users/:user_id" }],
  },
  {
    method: "post",
    path: "/users/add",
    check_access: [{ prefix: "/users" }],
  },
];
```

The presence of a `check_access` value for endpoints will indicate that these points are
controlled by `Access.Check` middleware. Thus, the marking "raised up" information that
can be used to visualize the structure of requests and use those of them to which the
relevant marking procedures should be applied.

## Sticker

The `@Sticker ()` decorator is used in situations where generic classes are used to create route nodes
from which active route nodes inherit.

Example:

```ts
// // to quickly create api methods around the catalog data models, we will create a class
// that will provide standard middleware for this data segment, somehow safely filtering incoming values
class Catalogs {
  model: Model;
  where = {};
  body = {};

  @Middleware()
  static SafeQuery(@Query() query, @This() _this, @Next() next) {
    _this.where = this.FilterQuery(_this.model, query);
    return next();
  }

  @Middleware()
  static SafeBody(@Body() body, @This() _this, @Next() next) {
    _this.body = this.FilterBody(_this.model, body);
    return next();
  }

  // only use values that have passed safe internal validation in the data model
  static FilterQuery(model, query) {
    return model.safeQuery(query);
  }

  // only use values that have passed safe internal validation in the data model
  static FilterBody(model, body) {
    return model.safeBody(body);
  }
}

// inherit from this class the route node for working with categories
class Categories extends Catalogs {
  model = models.Categories;

  @Get()
  // let's apply typical data filtering to create search criteria in the data model
  @Use(Categories.SafeQuery)
  static Index(@This() _this) {
    return _this.model.find(_this.where);
  }

  @Post()
  // apply typical data filtering to restrict incoming values
  @Use(Categories.SafeBody)
  static Add(@This() _this) {
    return _this.model.create(_this.body);
  }
}

// inherit from this class the route node for working with brands
class Brands extends Catalogs {
  model = models.Brands;

  @Get()
  // let's apply typical data filtering to create search criteria in the data model
  @Use(Brands.SafeQuery)
  static Index(@This() _this) {
    return _this.model.find(_this.where);
  }

  @Post()
  // apply typical data filtering to restrict incoming values
  @Use(Brands.SafeBody)
  static Add(@This() _this) {
    return _this.model.create(_this.body);
  }
}
```

Although this code contains no compliant errors, it will not work correctly.

Due to the class inheritance mechanism in JS, the `Brands.SafeBody` and `Brands.SafeQuery` functions
(as well as `Categories.SafeBody` and `Categories.SafeQuery`) will actually return a handle to
the `Catalogs.SafeQuery` and `Catalogs.SafeBody` functions, and when called the `@This` decorator
will create an instance of the `Catalogs` class, and when calling the `FilterQuery` and `FilterBody`
methods, errors will occur, since there are no data models defined in the context of the `Catalogs` class.

In order for this code to work, you need to add the decorator `@Sticker()` for the `middleware` functions
`Catalogs.SafeQuery` and `Catalogs.SafeBody`.

```ts
class Catalogs {
  model: Model;
  where = {};
  body = {};

  @Sticker()
  @Middleware()
  static SafeQuery(@Query() query, @This() _this, @Next() next) {
    _this.where = this.FilterQuery(_this.model, query);
    return next();
  }

  @Sticker()
  @Middleware()
  static SafeBody(@Body() body, @This() _this, @Next() next) {
    _this.body = this.FilterBody(_this.model, body);
    return next();
  }
  // ...
}
```

In this case, for the methods marked with this decorator, a check will be performed:
whether `route.constructor` is a descendant of `cursor.constructor`, and if so, the
value of `cursor.constructor` in this method will be replaced with the value of
`route.constructor` (the value will be, as it were, "sticked", hence the name of the decorator).

This technique works only for `middleware`, and is not yet suitable for `endpoint`. Thus, you
cannot use a bridge to the parent class with type procedures. This opportunity may appear later.

**Important**: The `@Sticker` decorator is an experimental feature and could be significantly
redesigned and modified.

## Cyclic dependencies

`aom` implies the reuse of some classes in the context of others, which can create cyclic module dependencies.
This is critical when using the `StateMap` and `This` decorators, as well as the `Bridge` and `Use` decorators.

To solve this problem, use the function `FwdRef`.

Example:

```ts
// ... users.ts
import { Query, This, Bridge, Get } from "aom";
import { User } from "./user";

@Bridge(`/user_${User.id}`, User)
class Users {
  model = getModelForClass(classes.Users); // for the context instance, create a typegoose model around the class `classes.Users`

  @Get()
  static Index(@Query() query, @This() { model }: Users) {
    return model.find({ ...query });
  }
}

// ... user.ts
import { Query, This, Bridge, Get, FwdRef } from "aom";

// for eslint, turn off the processing of the cyclic dependency error
// eslint-disable-next-line import/no-cycle
import { Users } from "./users";

@Use(User.Init)
class User {
  // instead of declaring its own data model value for the node, we use it from the `Users` class
  @Get()
  static Index(@Query() query, @This(FwdRef(() => Users)) { model }: Users) {
    return model.find({ ...query });
  }
}
```

If you just use `@This (Users)`, then the value `undefined` will be passed to the decorator in the arguments,
which will result in an instance of the `User` class, and the value of `model` will be unavailable.

For other decorators function `FwdRef` applied as follows:

- `@Use(FwdRef(()=>Node.Middleware))`
- `@Bridge('/path', FwdRef(()=>NextNode))`
- `@StateMap(FwdRef(()=>AnotherNode)`

**Important**: It is strongly recommended to use `eslint` with the **active** rule `import/no-cycle` in order
to detect situations with circular references and correctly apply `FwdRef`.
