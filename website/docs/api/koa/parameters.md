---
title: Parameters decorators
sidebar_position: 4
---

# Parameters decorators

All methods participating in route nodes must use decorated parameters in order to correctly
operate with the context of actions. All decorators return isolated values in the context of
the current request.

## Args

The basic decorator `@Args` allows you to get the general data structure that is the current context
of query being executed.

This structure has the interface:

```ts
interface IArgs {
  ctx: Context;
  next: Next;
  route: IRoute;
  cursor: ICursor;
}
```

Where:

- `ctx` and `next` are typical values used by `koa`
- `route` is a structure, pointing to the endpoint of the route
- `cursor` is a structure pointing to the current point of the route

Let's dwell on `cursor` and `route`, as they play an important role in organizing routes structures.

The `cursor` has the interface:

```ts
interface ICursor {
  constructor: Function; // the class that is currently being executed
  property: string; // the method name that is currently being executed
  handler: Function; // the function that is currently being executed (handler === constructor[property])
  prefix: string; // prefix of the route segment that the cursor is currently traversing
}
```

The `route` has the interface:

```ts
interface IRoute {
  constructor: Function; // the class that contains the endpoint of the route
  property: string; // the name of the method to be called at the endpoint of the route
  handler: Function; // the function that will be called at the end point of the route (handler === constructor[property])
  method: string; // the method that is applied to the endpoint
  path: string; // full path of the route (as a pattern with parameters `/ files /: filename`)
  cursors: Function[]; // a list of all cursors including this route
  middlewares: Function[]; // a list of compiled functions for execution in `koa` context (functions `(ctx, next)=> {...}`)
}
```

Consider an example of the method `GET /users/user_:id`, which is composed of a chain static methods
of three classes, decorated with `@Middleware`, `@Bridge` and `@Endpoint`:

```ts
[Root.Init, Users.Init, Users.UserBridge, User.Init, User.Index];
```

When accessing this route, all functions of the chain will be sequentially called, and if each of them
will correctly return a `next` value, will be called the final function in which is expected the result.

On any part of the route in any middleware, the `route` value will look like:

```ts
{
  constructor: User,
  property: `Index`,
  handler: User.Index,
  method: "get",
  path: "/users/user_:id",
  cursors: [
    { constructor: Root, property: "Init", handler: Root.Init, prefix: "/" },
    { constructor: Users, property: "Init", handler: Users.Init, prefix: "/users" },
    { constructor: Users, property: "UserBridge", handler: Users.UserBridge, prefix: "/users/user_:id", },
    { constructor: User, property: "Init", handler: User.Init, prefix: "/users/user_:id" },
    { constructor: User, property: "Index", handler: User.Index, prefix: "/users/user_:id" },
  ],
  middlewares: [async (ctx, next)=> {...}, ....]
};
```

Thus, at any point on the route, you can get information about the destination, and if necessary
perform any checks or log actions.

The value of `cursor` will be different at each location in the route.
For the first element, it will be equal to:

```ts
{
  constructor: Root,
  property: `Init`,
  handler: Root.Init,
  prefix: '/'
}
```

For the second element, it will be:

```ts
{
  constructor: Users,
  property: `Init`,
  handler: Users.Init,
  prefix: '/users'
}
```

For the third:

```ts
{
  constructor: Users,
  property: `UserBridge`,
  handler: Users.UserBridge,
  prefix: '/users/user_:id'
}
```

For the fourth:

```ts
{
  constructor: User,
  property: `Init`,
  handler: User.Init,
  prefix: '/users/user_:id'
}
```

For the fifth:

```ts
{
  constructor: User,
  property: `Index`,
  handler: User.Index,
  prefix: '/users/user_:id'
}
```

Thus, at each step of the route, reflexive information about who is processing it and in what section
can be obtained. It can be used for logging, controlling access to routes, as well as saving and
applying contextual data in any of its sections.

If compound routes were used using the `@UseNext` decorator, then subsequent called functions will
be included in the general list of cursors, and will follow the value that defines the endpoint
itself, and have the same `prefix` value.

The presence of the `constructor` value in `route` and `cursor` makes it possible to use values from
the structure `ctx.$StateMap = new WeakMap`, which are described in more detail in the description
for decorators [`StateMap`](#statemap) and [`This`](#this).

The values of the `route` object are the same for all points along the route. The values in the
`route` structure can be extended with the [`@Marker`](./middlewares#marker) decorator (described below)

For a `cursor` object, the value `constructor` can be changed in a special case: if is applied
the overload decorator [`Sticker`](./middlewares#sticker) (described below)

### Custom arguments decorators

The `@Args` decorator allows you to accept a function as argument, which will be passed a structure
of `IArgs` from which specific values can be retrieved and returned. Asynchronous functions
are allowed.

Example:

```ts
import { Args, Get } from "aom";
const getUrl = (args) => args.ctx.url;
class Index {
  @Get()
  static Main(@Args(getUrl) url) {
    return url;
  }
}
```

You can create your own argument decorators using the `Args` call:

```ts
import { Args, Get } from "aom";
const Url = () => {
  const handler = (args) => args.ctx.url;
  return Args(handler);
};
class Index {
  @Get()
  static Main(@Url() url) {
    return url;
  }
}
```

All existing argument decorators are special cases of the `@Args` decorator.

## Ctx

Decorator `@Ctx()` returns the standard `koa` object `ctx`, to which its typical methods can be applied,
extracted standard, or, if specific libraries were used, special values.

## Req, Res

The decorators `@Req()` and `@Res()` return the standard `koa` objects `ctx.req` and `ctx.res`.
They do not accept any arguments, and allows to work with the context values at a low level.

## Next

The `@Next()` decorator allows you to get a special `next`-function.

In general, the `next`-function is used in the same way as the standard `koa` `next`-function:
it indicates that is expected the result from the next function in the middlewares chain. Most often
used as a return value in `middleware`.

When using arguments, the `next`-function allows you to return the result from another `endpoint`
or `middleware`. Accepts a sequence of static methods as arguments, which are the endpoint or middleware.

Example:

```ts
@Use(User.Init)
class User {
  data: any;

  @Middleware()
  static async Init(@Params("user_id") userId, @This() user: User, @Next() next) {
    user.data = await models.Users.findById(userId);
    return next(); // when called with no arguments, indicates that the next function in the chain is expected
  }

  @Get()
  static Info(@This() { data }: User) {
    return data;
  }

  @Patch()
  static async Update(@This() { data }: User, @Body() body, @Next() next) {
    const { _id } = data;
    await models.Users.update({ _id }, { $set: body });
    // can take a chain of middleware and endpoint as arguments
    // executes them sequentially and returns the result corresponding to the last value in the chain
    // breaks the execution in the case of error
    return next(User.Init, User.Info);
  }
}
```

## Err

The `@Err()` decorator returns an `error`-function. In general, `aom` will react to `throw` anywhere
in the call chain, and return it as a 500 error (or use the value of `status` from the error object).

The `error`-function received by the `@Err` decorator will return an error with the specified
`status` code and additional `data` information.

The decorator can take as an argument an error constructor, which will be used when an error is generated.
**Important**: the error constructor must be inherited from the class `Error`.

The `error` function uses the arguments:

- message: string - error message, required
- status?: number - error code, default 500
- data?: any - custom structure with error data

The function result can be returned via `return` or `throw`.

Example:

```ts
import { Params, Err, Next, Middleware } from "aom";

// define specific ErrorResponse class extends on standart Error
class ErrorResponse extends Error {
  status: number;
  data: any;
  constructor(message, status = 500, data = undefined) {
    this.message = message;
    this.status = status;
    this.data = data;
  }

  static toJSON() {
    return { message: this.message, status: this.status, data: this.data };
  }
}

@Use(User.Init)
class User {
  @Middleware()
  static async Init(@Params("user_id") userId, @Err(ErrorResponse) err, @Next() next) {
    const user = await models.Users.findById(userId);
    if (user) {
      return next();
    } else {
      // will return an error with a 404 code and the message "user not found"
      // the value `data` will be an object with a parameter that did not pass validation
      // an instance of the ErrorResponse class will be created
      return err("user not found", 404, { user_id: userId });
    }
  }
  // or
  @Middleware()
  static async Init(@Params("user_id") userId, @Err() err, @Next() next) {
    const user = await models.Users.findById(userId);
    if (user) {
      return next();
    } else {
      // will return an error with a 404 code and the message "user not found"
      // the value `data` will be an object with a parameter that did not pass validation
      // an instance of the Error class will be created
      return err("user not found", 404, { user_id: userId });
    }
  }
}
```

### Other ways to catch errors

The call of the decorated methods in `aom` occurs inside the `try {} catch (e) {}` construct:
any` throw` will be interpreted as an error on the route, even if it was called by a third-party library,
and will be returned as the value of `ctx.body = e`, interrupting the route.

Instead of calling the `error` function, you can also return an error instance: `aom` checks
if the returned value is an error object, then it will stop executing the route, and return
an error with a code of 500, or with the value `status`, if it present in the object values.

Thus, instead of the `error`-function, you can use your own error type, which is inherited from the
`Error` class, using the `throw` or returning the instance of class.

Example:

```ts
// ... use the classs ErrorResponse, decribed above
class Auth {
  @Middleware()
  static Required(@Next() next, @Headers("authorization") token) {
    if (await models.Auth.checkToken(token)) {
      return next();
    } else {
      return new ErrorResponse("access denied", 403);
    }
  }
}
```

## Query

The `@Query()` decorator allows you to get the `ctx.query` value typical of `koa`.

```ts
import { Get, Query } from "aom";
import fs from "fs";

class Files {
  @Get()
  static Index(@Query() query) {
    const { name } = query;
    return fs
      .readdirSync(__dirname)
      .filter((filename) => (name ? filename.search(name) >= 0 : true));
  }
}
```

The decorator can take a handler function as an argument, in which you can transform or
check the incoming values.

```ts
const QueryParser = (query) => {
  const { offset = 0, limit = 10, sort = "name", ...where } = query;
  return { offset, limit, sort, where };
};

class Users {
  @Get("/search")
  static Search(@Query(QueryParser) { where, offset, sort, limit }) {
    return models.Users.find(where).order(sort).offset(offset).limit(limit);
  }
}
```

## Body

The `@Body()` decorator allows you to get the `ctx.request.body` value typical of `koa`.

```ts
import { Get, Body } from "aom";
import fs from "fs";

class Users {
  @Post()
  static save(@Body() body) {
    return models.Users.create(body);
  }
}
```

The decorator can take a handler function as an argument, in which you can transform or
check the incoming values.

```ts
// using the packages `class-transformer` and `class-validator`
// assuming that the data model applies the appropriate decorators
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
// allowed to use asynchronous functions in handlers
const ValidateBody = async (body) => {
  const safeBody = plainToClass(models.Users, { ...body });
  const validateErrors = await validate(safeBody, { whitelist: true });

  if (validateErrors.length) {
    throw Object.assign(new Error("validation error"), { data: validateErrors });
  }
  return safeBody;
};

class Users {
  @Post("/add")
  static Add(@Body(ValidateBody) userData) {
    // `userData` will definitely contain safe data that can be added to the database
    return models.Users.create({ ...userData });
  }
}
```

## Params

The `@Params()` decorator allows you to get `ctx.params` values typical of `koa`. May take a parameter
name as an argument, returning its value.

```ts
import { Get, Middleware, Params, Next } from "aom";

class User {
  @Middleware()
  static async Init(@Params() params, @Next() next) {
    const user = await models.Users.findById(params.user_id);
    return next();
  }
  // or
  @Middleware()
  static async Init(@Params("user_id") userId, @Next() next) {
    const user = await models.Users.findById(userId);
    return next();
  }
}
```

## Headers

The `@Headers()` decorator allows you to get `ctx.headers` values typical of `koa`. May take a parameter
name as an argument, returning its value.

```ts
import { Get, Headers, Middleware, Next } from "aom";

class Auth {
  @Middleware()
  static async Init(@Headers() headers, @Next() next) {
    const checkToken = await models.Auth.checkToken(headers.authorization);
    return next();
  }
  // or
  @Middleware()
  static async Init(@Headers("authorization") authToken, @Next() next) {
    const checkToken = await models.Auth.checkToken(authToken);
    return next();
  }
}
```

## State

The `@State()` decorator allows you to get `ctx.state` values typical of `koa`. May take a parameter
name as an argument, returning its value.

```ts
import { Get, State, Params, Middleware, Next } from "aom";

@Use(User.Init)
class User {
  // save the object into `state`
  @Middleware()
  static async Init(@State() state, @Params("user_id") userId, @Next() next) {
    state.user = await models.Users.findById(userId);
    return next();
  }

  // get the values from `state`
  @Get()
  static async Index(@State("user") user) {
    return user;
  }
}
```

## Session

The `@Session()` decorator allows you to get `ctx.session` values typical of `koa`. May take a parameter
name as an argument, returning its value.

**Important**: you must use middleware libraries to use sessions in `koa`
(for example: [`koa-session`](https://www.npmjs.com/package/koa-session))

```ts
import { Middleware, Post, Delete, Session, Body } from "aom";

@Use(Basket.Init)
class Basket {
  // make sure there is a list for storing items in the basket
  @Middleware()
  static Init(@Session() session, @Next() next) {
    if (!session.basket) {
      session.basket = [];
    }
    return next();
  }
  // add item to cart
  @Post()
  static async AddItem(@Body() item, @Session("basket") basket) {
    basket.push(item);
    return basket;
  }

  // clear the basket
  @Delete()
  static async Clear(@Session() session) {
    session.basket = [];
    return basket;
  }
}
```

## Files

The `@Files()` decorator allows you to get data from `ctx.request.files`, which is typical for the most
`koa` libraries to upload files.

**Important**: you must use middleware libraries to upload files in `koa`
(for example: [`koa-body`](https://www.npmjs.com/package/koa-body))

```ts
import { Post, Files } from "aom";
import fs from "fs";
import path from "path";

class Files {
  // wait for uploading the only file
  @Post()
  static UploadFiles(@Files("file") file: File) {
    const filename = path.join(__dirname, file.name);
    fs.renameSync(file.path, filename);
    return file;
  }
  // wait for uploading the list of files
  @Post("/mass_upload")
  static UploadFiles(@Files() files: Record<string, File>) {
    const filenames = [];
    Object.keys(files).forEach((key) => {
      const file = files[key];
      const filename = path.join(__dirname, file.name);
      fs.renameSync(file.path, filename);
      filenames.push(filename);
    });
    return filenames;
  }
}
```

## Cursor

The `@Cursor()` decorator allows you to get the `cursor` value described above.

## Route

The `@Route()` decorator allows you to get the `route` value described above.

## StateMap

`aom` extends the context value of `koa` with the special construction `ctx.$StateMap = new WeakMap()`,
which allows you to store associations based on abstract keys in the context. This allows to make
associations based on the classes that make up the route nodes.

The most common use of `@StateMap()` is to store local states of class instances in a `middleware`
function and then apply them in other methods.

The `@StateMap()` decorator can take an argument that will return a value from the store with a key
equal to this argument.

Example:

```ts
class Auth {
  user: models.Users;
  login: models.UserLogins;
  // create a layer that determines by the token whether authorization is available to the user
  // and if available, saves authorization information in stateMap by the class key: user and login
  @Middleware()
  static Init(@Headers("authorization") token, @Next() next, @StateMap() stateMap, @Err() err) {
    const authData = models.Auth.checkToken(token);
    if (authData) {
      const auth = new this(); // since the method is called with the same context, `this` is the `Auth` class
      auth.user = await models.Users.findById(authData.userId);
      auth.login = await models.UserLogins.findById(authData.userLoginId);
      stateMap.set(this, auth);
    } else {
      return err("wrong auth", 403, { token });
    }
  }
}
// ... then we will get the authorization information in another middleware or endpoint

@Use(Auth.Init) // define that successful authorization is required to access the route node
class Account {
  // this method will be guaranteed to be called if authorization by token was successful
  // which means that StateMap will have a value by the Auth key, which is an instance of this class
  // with defined values
  @Get()
  static async Index(@StateMap(Auth) auth: Auth, @Next() next) {
    const { user, login } = auth;
    // user is a data model object `models.Users`, all its methods are available to it
    const stat = await user.getStat();
    return { user, login, stat };
  }
}
```

The use of `WeakMap` is due to the criteria for speed and memory optimization for storing values.
If desired, you can overload it by creating a `middleware` that will use the `Map` store.

Example:

```ts
@Use(Root.Init) // being the first, Root.Init will be called before all requests in all route branches
@Bridge("/files", Files)
@Bridge("/users", Users)
class Root {
  @Middleware()
  static Init(@Ctx() ctx, @Next() next) {
    // overload the ctx variable
    ctx.$StateMap = new Map();
    return next();
  }

  @Get()
  static Index() {
    return "index page";
  }
}
```

## This

The `@This()` decorator is an extension of the `@StateMap()` decorator. It checks
if `ctx.$StateMap` has a key value equal to the value of `constructor` in the current `cursor`. Thus,
in general, it checks if the `StateMap` has a value for the current class that is currently doing the work,
and if not, creates its singletone instance and returns the value.

The most common case of the `@This()` decorator is to use the same route node in the initiating
`middleware` and` endpoints`.

```ts
@Use(User.Init)
class User {
  user: models.Users;
  stat: any;

  @Middleware()
  static async Init(@Params() { user_id }, @Next() next, @Err() err, @This() _this: User) {
    const userInfo = await models.Users.findById(user_id);
    if (userInfo) {
      _this.user = userInfo;
      _this.stat = await userInfo.getStat();
      return next();
    } else {
      return err("user not found", 404);
    }
  }

  @Get()
  static Info(@This() user: User) {
    return user; // returns { user, stat }
  }

  @Delete()
  static async Delete(@This() { user }: User) {
    const result = await user.delete();
    return result;
  }
}
```

The `@This()` decorator can take another class as an argument. In this case, will be returned the value for
this class from `ctx.$StateMap`, and if it was not there, an instance of this class will be created
and returned, with the specified argument stored in `ctx.$StateMap`.

```ts
class Files {
  where = {};

  @Get()
  static Index(@This() { where }: Files) {
    return models.Files.find({ ...where });
  }
}

// ...
class User {
  user: models.Users;

  @Bridge("/files", Files)
  static userFiles(@This() { user }: User, @This(Files) files: Files, @Next() next) {
    files.where = { userId: user.id };
    return next();
  }
}
```

Thus, using the decorator `@StateMap()` allows you to store an arbitrary value by key,
while `@This()` always returns a singletone instance of the class passed in the argument
or in the current cursor.

**Important**: all classes for which the `@This` decorator will be used must be able to create their
own instances without arguments, since the decorator does not support passing any values to the constructor.
