# AOM: API Over Models

[Russian readme](https://github.com/scarych/aom/blob/master/readme.ru.md)

`aom` - it is meta-framework made of typescript-decorators, which allows to fast and comfortable
create safe api-services, using the principle of accumulation data layers, enriched with abstractions.

The main idea sounds like: "don't duplicate the code, link the code". `aom` allows to use data
proccessing, made to cover most cases you need. At the same time `aom` do not limit the developer
in frames of the only framework, but gives the ability to use third-party libraries and packages.

`aom` is not a "thing in itself "- a framework that operates exclusively on its own codebase and only
works in its own environment. Its important feature is the ability to combine with the "classic" code
on `koa`, which makes it useful when migrating functionality already existing projects.

`aom` does not run code in an isolated environment, but generates structures that are compatible with
popular libraries: `koa-router`,` koa-session` and others, which allows, if necessary,
keep the existing code-stack, and comfortably extend it in the `aom` +` typescript` methodology.

## aom/koa

At the present time realised the functionality based on http-framework
[`koa@2`](https://www.npmjs.com/package/koa).

The construction of a route map is using a set of decorators that differ in types:

- `endpoints` - to indicate the endpoints of the route. Includes decorators:
  `Endpoint`,` Get`, `Post`,` Patch`, `Put`,` Options`, `Delete`,` All`
- `middlewares` - to indicate middleware-functions, "bridges" and expansion of the context.
  The list includes to itself: `Middleware`,` Use`, `Bridge`,` Marker` and `Sticker`
- `parameters` - for parameterization of incoming arguments, used to get typical or
  specialized values ​​into middlewares or endpoints functions. The list includes but
  not limited to these values: `Args`,` Ctx`, `Body`,` Query`, `Session`,` State`,
  `Headers`,` Param`, `Files`,` Next`, `Req`,` Res`, `Target`,` Cursor`, `Routes`,` StateMap`, `This`.
  It is also possible to create your own argument decorators to implement special logics.

The code sample with `aom/koa` decorators:

```ts
@Bridge("/auth", Auth)
@Bridge("/shop", Shop)
@Bridge("/account", Account)
class Root {
  @Get()
  static Index() {
    return models.Settings.findOne({ enabled: true });
  }
}

// ...
class Auth {
  user: models.Users;
  login: models.UserLogins;
  token: models.AuthTokens;

  @Middleware()
  static async Required(
    @Headers("authorization") token,
    @This() _this: Auth,
    @Next() next,
    @Err() err
  ) {
    const authToken = await models.AuthTokens.checkToken(token);
    if (authData) {
      _this.token = authToken;
      _this.user = await models.Users.findById(authToken.userId);
      _this.login = await models.UserLogins.findById(authToken.loginId);
      return next();
    } else {
      return err("access denied", 403);
    }
  }

  @Post()
  static async Login(@Body() { login, password }, @Err() err) {
    const authLogin = await models.UserLogins.authLogin(login, password);
    if (checkLogin) {
      return models.AuthTokens.generateToken(authLogin);
    } else {
      return err("wrong login", 403);
    }
  }
}

// ...
class Shop {
  @Get()
  static Index(@Query() query) {
    return models.Products.find({ ...query });
  }

  @Get("/categories")
  static Categories(@Query() query) {
    return models.Categories.find({ ...query });
  }

  @Get("/brands")
  static Brands(@Query() query) {
    return models.Brands.find({ ...query });
  }

  @Post("/add_to_cart")
  @Use(Auth.Required)
  static AddToCart(@Body() { productId, quantity }, @StateMap(Auth) { user }: Auth) {
    const addUserCart = await user.addProductToCart(productId, quantity);
    return user.getProductsCart();
  }
}

// ...
@Use(Auth.Required)
class Account {
  @Get()
  static async Index(@StateMap(Auth) { user, login }: Auth) {
    const orders = await user.getOrders();
    return { user, login, orders };
  }

  @Post("/logout")
  static async Logout(@StateMap(Auth) { token }: Auth) {
    await token.remove();
    return { message: "success logout" };
  }
}
```

The above code replaces the need to use the "classic" route list with appropriate restrictions
in the middlewares arguments (the ability to use only `async (ctx, next) => {...}`):

```ts
router.get("/", Root.Index);
router.post("/auth", Auth.Login);
router.get("/shop", Shop.Index);
router.get("/shop/categories", Shop.Categories);
router.get("/shop/brands", Shop.Brands);
router.post("/shop/add_to_cart", Auth.Required, Shop.AddToCart);
router.get("/account", Auth.Required, Account.Index);
router.post("/account/logout", Auth.Required, Account.Logout);
```

Other advantages of this approach consist in the ability to use additional decorators that allows you
to compose autodocumentation in the format [`OpenApi`](#aom/openapi), and to have more
structured and understandable code, convenient for refactoring and data control.

### How does this works

A route node - is a class responsible for a local fragment of a route map. All elements of the route
node become available after it is connected to another node.

After assembly, route nodes unfolds in a sequence of `middleware` functions, which ends by the final
`endpoint`, thereby creating a complete structure of all routes, described in communication nodes.

Route nodes are created so that their elements can be reused in other parts of the routes, including
another api-services.

All `endpoint`-,` middleware`- and `bridge`-functions are created above the static methods of the class,
while the methods and properties of instances can be applied as contextual data items, which accessed
via decorators [`StateMap`](#statemap) and [`This`](#this).

The routing node does not have its own path address, and can be connected to another node
via the custom prefix value or parameter, using bridges `@Bridge`

The collection of nodes and connections between them creates a route map, which can be entirely or
fragmentarily applied to `koa-router` (or one of its variants) to create the required set of routes
in the context of the `koa` application. At the end of assembly the routes nodes forms isolated
chains of functions `(ctx, next) => {...}`.

```ts
router[method](url, ...[Route1.Middleware1, Route2.Middleware2, Route3.Bridge, Route4.Endpoint]);
```

Connecting route nodes to the server on `koa` is as follows:

```ts
import koa from "koa";
import koaRouter from "koa-router";
import { $ } from "aom/koa"; // assembler of routes map
import Index from "./routes"; // root route node

const app = new koa();
const router = new router();

// initiate the assembly of routes: the first argument is the root node, the second is the prefix
// a custom route node can be used as a root node
// in this case, only those links will be activated that are connected directly with it
// prefix allows you to set a common prefix for all addresses on the route,
// for example `/ v1` to specify API versioning, by default` / `,
const $aom = new $(Index, "/");

// get a list of addresses, methods and middlewares functions
// collection of [{method: string, path: string, middlewares: Function []}]

const routes = $aom.routes();
// apply the routes to the koa-router instance
routes.forEach(({ method, path, middlewares }) => {
  router[method](path, ...middlewares);
});

// alternative way: pass to the handler method using the same values
// and apply them to the used router
$aom.routes(({ method, path, middlewares }) => {
  router[method](path, ...middlewares);
});

// transfer data from the router to the server
app.use(router.routes()).use(router.allowedMethods());

// run server on neccessary port
app.listen(3000);
```

If necessary, you can use other `koa` stack libraries, creating the necessary middleware before
or after connecting routes on the `aom/koa` decorators.

### The routes endpoints

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
import { Get, Post, Body } from "aom/koa";

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

This will create a route node with methods: `GET /`, `POST / save` and `GET / choose /: variant`,
which, after connecting to the route map, will provide access to them using the declared prefixes.

### Arguments decorators

All methods participating in route nodes must use decorated arguments in order to correctly
operate with the context of actions. All decorators return isolated values in the context of
the current request.

#### Args

The basic decorator `@Args` allows you to get the general data structure that is the current context
of query being executed.

This structure has the interface:

```ts
interface IArgs {
  ctx: Context;
  next: Next;
  target: ITarget;
  cursor: ICursor;
  routes: ITarget[];
}
```

Where:

- `ctx` and` next` are typical values used by `koa`
- `target` is a structure, pointing to the endpoint of the route
- `cursor` is a structure pointing to the current point of the route
- `routes` - a complete list of all routes with possible marker extensions

Let's dwell on `cursor` and` target`, as they play an important role in organizing routes structures.

The `cursor` has the interface:

```ts
interface ICursor {
  constructor: Function; // the class that is currently being executed
  property: string; // the method name that is currently being executed
  handler: Function; // the function that is currently being executed (handler === constructor[property])
  prefix: string; // prefix of the route segment that the cursor is currently traversing
}
```

The `target` has the interface:

```ts
interface ITarget {
  constructor: Function; // the class that contains the endpoint of the route
  property: string; // the name of the method to be called at the endpoint of the route
  handler: Function; // the function that will be called at the end point of the route (handler === constructor[property])
  method: string; // the method that is applied to the endpoint
  path: string; // full path of the route (as a pattern with parameters `/ files /: filename`)
  middlewares: Function[]; // a list of all middlewares preceding the final call (descriptors to static class methods)
}
```

Consider an example of the method `GET /users/user_:id`, which is composed of a chain static methods
of three classes, decorated with `@Middleware`,` @Bridge` and `@Endpoint`:

```ts
[Root.Init, Users.Init, Users.UserBridge, User.Init, User.Index];
```

When accessing this route, all functions of the chain will be sequentially called, and if each of them
will correctly return a `next` value, will be called the final function in which is expected the result.

On any part of the route in any middleware, the `target` value will look like:

```ts
{
  constructor: User,
  property: `Index`,
  handler: User.Index,
  method: 'get',
  path: '/users/user_:id',
  middlewares: [Root.Init, Users.Init, Users.UserBridge, User.Init]
}
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

The presence of the `constructor` value in `target` and `cursor` makes it possible to use values from
the structure `ctx.$StateMap = new WeakMap`, which are described in more detail in the description
for decorators [`StateMap`](#statemap) and [`This`](#this).

The values of the `target` object are the same for all points along the route. For a `cursor` object,
the value `constructor` can be changed in a special case: if is applied the overload decorator
[`Sticker`](#sticker) (described below)

The `routes` structure contains a list of all possible `target`-s in a given routes assembly, providing a
complete list of all routes available for a given configuration. The values in the `target` structure
can be extended with the [`@Marker`](#marker) decorator (described below)

The `@Args` decorator allows you to accept a function as argument, which will be passed a structure
of `IArgs` from which specific values can be retrieved and returned. Asynchronous functions
are allowed.

Example:

```ts
import { Args, Get } from "aom/koa";
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
import { Args, Get } from "aom/koa";
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

#### Ctx

Decorator `@Ctx()` returns the standard `koa` object `ctx`, to which its typical methods can be applied,
extracted standard, or, if specific libraries were used, special values.

#### Req, Res

The decorators `@Req()` and `@Res()` return the standard `koa` objects` ctx.req` and `ctx.res`.
They do not accept any arguments, and allows to work with the context values at a low level.

#### Next

The `@Next()` decorator allows you to get a special `next`-function.

In general, the `next`-function is used in the same way as the standard `koa` `next`-function:
it indicates that is expected the result from the next function in the middlewares chain. Most often
used as a return value in `middleware`.

When using arguments, the `next`-function allows you to return the result from another` endpoint`
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

#### Err

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
import { Params, Err, Next, Middleware } from "aom/koa";

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

##### Other ways to catch errors

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

#### Query

The `@Query()` decorator allows you to get the `ctx.query` value typical of` koa`.

```ts
import { Get, Query } from "aom/koa";
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

#### Body

The `@Body()` decorator allows you to get the `ctx.request.body` value typical of` koa`.

```ts
import { Get, Body } from "aom/koa";
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
// using the packages `class-transformer` и `class-validator`
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

#### Params

The `@Params()` decorator allows you to get `ctx.params` values typical of `koa`. May take a parameter
name as an argument, returning its value.

```ts
import { Get, Middleware, Params, Next } from "aom/koa";

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

#### Headers

The `@Headers()` decorator allows you to get `ctx.headers` values typical of `koa`. May take a parameter
name as an argument, returning its value.

```ts
import { Get, Headers, Middleware, Next } from "aom/koa";

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

#### State

The `@State()` decorator allows you to get `ctx.state` values typical of `koa`. May take a parameter
name as an argument, returning its value.

```ts
import { Get, State, Params, Middleware, Next } from "aom/koa";

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

#### Session

The `@Session()` decorator allows you to get `ctx.session` values typical of `koa`. May take a parameter
name as an argument, returning its value.

**Important**: you must use middleware libraries to use sessions in `koa`
(for example: [`koa-session`](https://www.npmjs.com/package/koa-session))

```ts
import { Middleware, Post, Delete, Session, Body } from "aom/koa";

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

#### Files

The `@Files()` decorator allows you to get data from `ctx.request.files`, which is typical for the most
`koa` libraries to upload files.

**Important**: you must use middleware libraries to upload files in `koa`
(for example: [`koa-body`](https://www.npmjs.com/package/koa-body))

```ts
import { Post, Files } from "aom/koa";
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

#### Cursor

The `@Cursor()` decorator allows you to get the `cursor` value described above.

#### Target

The `@Target()` decorator allows you to get the `target` value described above.

#### Routes

The `@Routes()` decorator allows you to get the `routes` value described above.

#### StateMap

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

#### This

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

### Мосты (Bridge) и прослойки (Middleware)

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
import { Get, Bridge, Use, Middleware } from "aom/koa";
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
import { Get, Bridge, Params, StateMap, Next, Err } from "aom/koa";
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

#### Marker

The `@Marker()` decorator allows you to enrich the information about the destination in the route map,
specifying that for the `target` element in the chain of `middleware` preceding it there are `cursor`
elements with certain `prefix` values, to which some special logic applied.

The decorator is applied to the `middleware`-function, so that the moment this middleware is used
in any part of the route map, the marker is applied to the endpoint according to the rules of the
marking function.

The `@Marker()` decorator accepts a mark function as an argument, which must take two arguments:
`target` and` cursor`. The cursor will always be the middleware to which the `@Marker` decorator is applied

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
    @Target() target, // endpoint from which it is important to know `path` and` method` values
    @Cursor() cursor, // cursor from which it is important to know `prefix` value
    @Next() next,
    @Err() err
  ) {
    // if a check is performed for the user, then let him pass this layer leading to the specific endpoint
    if (user.checkAccess(target, cursor)) {
      return next();
    } else {
      // otherwise we will return a 403 error
      return err("access denied", 403);
    }
  }

  // define the marker name
  static markerName = "check_access";
  // marking funciton
  static setMark(target: ITarget, cursor: ICursor) {
    const { markerName } = this;
    // if there is no required marker for the `target` element, then create it
    if (!target[markerName]) {
      target[markerName] = [];
    }
    // add the current cursor to the list for target
    target[markerName].push(cursor);
  }
}
// ... apply the created marker
// ...
@Bridge("/users", Users)
class Root {
  @Get()
  static Index(@Routes() routes) {
    return routes;
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

#### Sticker

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
`Catalogs.SafeQuery` and `Catalogs.SafeBody`

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
whether `target.constructor` is a descendant of` cursor.constructor`, and if so, the
value of `cursor.constructor` in this method will be replaced with the value of
`target.constructor` (the value will be, as it were, "sticked", hence the name of the decorator).

This technique works only for `middleware`, and is not yet suitable for `endpoint`. Thus, you
cannot use a bridge to the parent class with type procedures. This opportunity may appear later.

**Important**: The `@Sticker` decorator is an experimental feature and could be significantly
redesigned and modified.

## aom/openapi

Decorators of the `aom/openapi` collection allow to enrich route nodes with information that,
when assembled, generates schemas in the format [`OAS3`](https://swagger.io/specification/),
providing code auto-documentation.

In documentation generation uses principle of sequential processing of sections of
route nodes - middlewares and bridges - with the accumulation of relevant information and
the compilation of the resulting set on the route endpoint.

Thus, if one of the layers during data validation generates a special `403` error, then when
it is described for this middleware, it will propagate to the information in the `responses`
structure for the entire set of endpoints using this layer. Similar behavior will occur
when generating information about url parameters, security protocols and tags.

**Important**: in this documentation will be mentioned the data type `SchemaObject`. In this case,
it means using the interface from the `openapi3-ts` library, which means the typical configuration
of the object data schema in the `openapi` specification.

```ts
import { SchemaObject } from "openapi3-ts";
```

### Environment formation methodology

At its core, `aom` aims to reduce the amount of code used and minimize duplicate data structures.
The same principles are used in order to make the most of the possibilities of the `JavaScript`
language and to enrich the used data structures with an environment that will allow generating
the necessary code on demand.

Decorators from `aom/openapi` are used exclusively for route nodes, but they accept data model
references as their arguments. The documentation file is generated when the `toJSON` method
is called, so you need to take care that such data structures have the ability to return a
valid structure describing it with the` JSON-schema` standard using their own `toJSON` methods
(for classes or objects)

It is good practice to use decorators from the libraries [`class-validator`](https://www.npmjs.com/package/class-validator)
and [`class-validator-jsonschema`](https://www.npmjs.com/package/class-validator-jsonschema).

For example, in combination with the using the `typeorm` or` typegoose` methodology, this allows you
to create constructs like this:

```ts
// typeorm example
// use decorators from "class-validator-jsonschema" and "class-validator"
import { targetConstructorToSchema, JSONSchema } from "class-validator-jsonschema";
import { IsEnum, IsOptional, IsString, IsEnum } from "class-validator";
// use decorators and constructors from typeorm
import { EventSubscriber, Entity, Column, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { Index, ObjectIdColumn } from "typeorm";
import { BaseEntity } from "typeorm";

enum YesNo {
  YES = "yes",
  NO = "no",
}
// describe data model: make BaseModel from which will be inherits another classes
@EventSubscriber()
export default class BaseModel extends BaseEntity {
  @ObjectIdColumn()
  @JSONSchema({
    type: "string",
    readOnly: true,
  })
  _id: ObjectId;

  @Expose()
  @Column({ nullable: false, default: () => YesNo.NO })
  @Index()
  @IsEnum(YesNo)
  @IsOptional()
  isBlocked: YesNo;

  @CreateDateColumn()
  @Index()
  @IsOptional()
  @JSONSchema({
    format: "date",
    type: "string",
    readOnly: true,
  })
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  @IsOptional()
  @JSONSchema({
    format: "date",
    type: "string",
    readOnly: true,
  })
  updatedAt: Date;

  // need to create a static toJSON method that will get the JSON-schema for the current class
  static toJSON(): SchemaObject {
    return targetConstructorToSchema(this);
  }
}

// make data model Files extends on BaseModel
@Entity()
export default class Files extends BaseModel {
  @Column()
  @Index()
  @IsString()
  name: string;

  @Column()
  @IsString()
  path: string;

  @Column()
  @IsString()
  type: string;

  @Column()
  @IsString()
  @IsOptional()
  location?: string;
}
```

Thus, when the `Files` class will be used for generating JSON, the inherited method` static toJSON()`
will be called and will return a value correct of the `OAS3` specification with a description of
the data structure.

The same principle should be used for special cases of data structures that can be used during
development: input values or specific responses.

Example for describing user authorization form:

```ts
class toJSONSchema {
  static toJSON(): SchemaObject {
    return targetConstructorToSchema(this);
  }
}

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
```

Instead of using structures that generate a data schema using the `toJSON` method, you can
use an object with an existing data schema, including references to other values in the documentation.
In this case, it will be necessary to manually control the integrity of such links, which can
complicate the development.

### How does this works

Decorators from `aom/openapi` describe general schema properties that will be included in
the documentation. To get the final structure, you should use the `aom/koa/$` assembler,
into which you need to pass an instance of the `OpenApi` class, with information initiated
by the context of this api-service.

After all this class, enriched with relevant data during the decomposition of route nodes,
can be returned in one of the methods of the initiated API, or passed to a library like `swagger-ui`
as a source of JSON data.

Example:

```ts
// ... openapi.ts
import { OpenApi } from "aom/openapi";
// create an instance of the class with the documentation, with basic information contextual to this api-service
export default new OpenApi({
  info: {
    title: "Test documentation",
    description: "Example for autodocumentation built on routes decorators",
    contact: {
      name: "Kholstinnikov Grigory",
      email: "mail@scarych.ru",
    },
    version: "1.0.0",
  },
  openapi: "3.0.1",
});

// ... root.ts
import Docs from "./openapi";

@Bridge("/users", Users)
@Bridge("/files", Files)
class Root {
  @Summary("Index page")
  @Get()
  static Index() {
    return "aom is working";
  }

  @Summary("Documentation")
  @Description("Complete [`OAS3`](https://swagger.io/specification/) documentation")
  @Get("/openapi.json")
  static OpenApi() {
    return Docs; // will automaticaly transformed to JSON
  }
}
```

To apply data from decorators to a documentation file, you need to call the `docs` method
in the assembler, passing in it an initiated instance of the class with documentation.

```ts
// ... server.ts
import koa from "koa";
import koaRouter from "koa-router";
import { $ } from "aom/koa";
import Docs from "./openapi";
import Root from "./root";

const app = new koa();
const router = new koaRouter();

new $(Root)
  // assemble the routes
  .routes(({ method, path, middlewares }) => {
    router[method](path, ...middlewares);
  })
  // attach documentation
  .docs(Docs);

app.use(router.routes()).use(router.allowedMethods());
app.listen(3000);
```

### Describe the endpoints: Summary и Description

The decorators `@Summary()` and `@Description()` are used to describe the endpoint of the route.
Each of them takes a string value as an argument.

```ts
import { Summary, Description } from "aom/openapi";
import { Get, Post } from "aom/koa";

class Users {
  @Summary("Users list")
  @Description("Return the list of active users")
  @Get()
  static List() {
    return models.Users.find({ active: true });
  }

  @Summary("Add new user")
  @Description("Create new user and return user info")
  @Post()
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }
}
```

The description of the method is not cumulative information, and is used purposefully for each
endpoint of the route.

### Responses

Information about the structure of responses returned in a method is generated by the `@Responses()`
decorator. This decorator allows you to accumulate many answer options, if it is implied by the
logic of the route.

It takes as arguments a sequence of objects that satisfy the following structure:

```ts
interface OpenApiResponse {
  status: number; // response status code
  schema: SchemaObject | Function | any; // a JSON-schema or an object that generates JSON in JSON-schema
  contentType?: string; // content type, default `application/json`
  isArray?: boolean; // a flag that a array of objects (collection) is returned, by default `false`
  description?: string; // response description
}
```

An example of how this decorator works:

```ts
// describe a typical error that can be returned
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
  // at the middleware add a 403 response that will apply to all endpoints requiring authorization
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
  @Summary("Get users list")
  @Responses({
    status: 200,
    desciption: "Users list",
    isArray: true,
    schema: models.Users,
  })
  static Index() {
    return models.Users.find();
  }

  @Post()
  @Summary("Add new user")
  @Responses(
    {
      status: 200,
      description: "user info",
      schema: models.Users,
    },
    { status: 500, description: "adding user error", schema: ErrorResponse }
  )
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }
}
```

Thus, for the methods of the route node `Users`, in addition to the responses declared for them, will
also be added a variant with the error` 403`, since each of these methods requires authorization.

### RequestBody

The `@RequestBody` decorator allows you to add a description for the data structure passed in the
`post`/`put`/`patch` methods.

The decorator takes an argument that has the interface:

```ts
interface OpenApiRequestBody {
  description: string; //
  contentType?: string; // content type, default: application/json
  schema: SchemaObject | Function | any; // OAS-specified shema object
}
```

Applies exclusively to the route endpoint.

Usage example:

```ts
// define class describing auth form fields
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
  @Summary("User authentication")
  @Description("Accept login/password. Returns token")
  @RequestBody({ description: "Authentication data", schema: AuthForm })
  @Responses({ status: 200, description: "Authorization bearer token", schema: models.Tokens })
  @Post()
  static Login(@Body() { login, password }) {
    // ... login process
  }
}
```

When uploading files, use the correct `contentType` describing the expected data fields.

```ts
class Files {
  @Post("/upload")
  @RequestBody({
    description: "uploading file",
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
  @Summary("File upload")
  @Responses({ status: 200, description: "Uploaded file info", schema: models.Files })
  static Upload(@Files("file") file: File) {
    // ...
  }
}
```

### PathParameters

The `@PathParameters()` decorator allows you to describe a reference url parameter with some kind
of dynamic value. Most often it is an identifier of a database record, or some enum value.

The decorator allows you to accumulate values if it is implied by the route logic. The decorator
can be set to the `middleware`- or the `bridge`-function. In this case, it applies to all methods
that are in the pluggable node.

The decorator takes as an argument an object of the following interface:

```ts
interface OpenApiPathParameter {
  // key - the full value of the parameter in the url string, including regular expression delimiters
  [parameter: string]: {
    name: string; // parameter name
    schema: SchemaObject; // parameter data schema OAS-specified
    description?: string; // parameter description
    in?: "query" | "header" | "cookie" | "path"; // parameter location: header, path, query string, cookie; default `path`
    required?: Boolean; // required flag, default is `true`
  };
}
```

Example:

```ts
class Users {
  @Bridge("/user_:user_id", User)
  @PathParameters({
    ":user_id": {
      name: "user_id",
      description: "User identifier",
      schema: { type: "number" },
    },
  })
  static userBridge(@Next() next) {
    return next();
  }
}

class User {
  @Get()
  @Summary("User info")
  static Info(@Params("user_id") userId) {
    return models.Users.findById(userId);
  }

  @Delete()
  @Summary("Delete user")
  static Info(@Params("user_id") userId) {
    return models.Users.remove({ id: userId });
  }
}
```

For all methods in the route node `User` in the documentation will be modified `url` value:
the fragment `/user_:user_id` will be replaced with `/user_{user_id}`; and to the list of `parameters`
will be added next value:

```json
{
  "name": "user_id",
  "description": "User identifier",
  "schema": {
    "type": "number"
  },
  "in": "path",
  "required": true
}
```

**Important** You should pay special attention to how the parameter is specified in the key
of this structure.

Since the `OpenApi` specification obliges to use the notation like `{param}` to describe
the parameter in the path, while `koa` and other web frameworks use the `:param` notation to
define parameters, which also implies a possible refinement with a regular expression,
then exactly the full spelling of the parameter should be used as the key value (`[parameter:string]`),
including the symbol `:` and possible regexp rules.

Therefore, if a complex restriction is implied, the parameter value, for example, when you works with
values of the `ObjectId` type specific to the `MongoDb` database (that is, 24 characters combining
Latin letters and numbers), which can be safe written as `user_:user_id(.{24})`, then this spelling
must be the key. Otherwise, the parser will not be able to make the replacement, and the required
value will be missing in the documentation.

To optimize this process, it is recommended to use the following description of parameters and
their patterns:

```ts
// use the User class to store information about what parameters it will connect to other nodes
@Use(User.Init)
class User {
  // the name of the parameter by which it can be obtained in the arguments to the methods
  static id = "user_id";
  // full spelling of the parameter, using restrictions by regular expression
  static toString() {
    return `:${this.id}(.{24})`;
  }
  // parameter schema using both the exact meanings of name and spelling
  static parameterSchema() {
    return {
      [`${this}`]: {
        name: this.id,
        description: "User identifier",
        schema: {
          type: "string",
          pattern: "[a-z,0-9]{24}",
        },
      },
    };
  }

  @Middleware()
  @PathParameters(User.parameterSchema())
  // use the parameter name into argument decorator
  static Init(@Params(User.id) userId, @Next() next, @Err() err) {
    // ... some middleware logic
  }
}

//... usage in other route nodes
@Bridge(`/user_${User}`, User) // will be received the spelling of the parameter including restrictions on the number of characters
class Users {
  // ... some class methods
}
```

### Parameters

To add to the documentation information about parameters that can be passed in the query string,
headers and cookies, you need to use the `@Parameters` decorator.

It takes as arguments a sequence of values of interface:

```ts
interface OpenApiParameter {
  name: string; // parameter name
  in: "query" | "header" | "cookie" | "path"; // parameter location: header, path, query string, cookie
  schema: SchemaObject; // parameter data schema OAS-specified
  description?: string; // parameter description
  required?: Boolean; // flag of parameter required, default: false
}
```

`@Parameters` decorator applies exclusively to the route endpoint.

Example:

```ts
class Brands {
  @Summary("Brands catalog")
  @Responses({ status: 200, isArray: true, schema: models.Brands })
  // allows to use search by fields
  @Parameters(
    // `title` (string)
    { name: "title", in: "query", schema: { type: "string" } },
    // `enabled` (enum)
    { name: "enabled", in: "query", schema: { type: "string", enum: ["yes", "no"] } }
  )
  @Get()
  static Index(@Query() query) {
    return models.Brands.find({ ...query });
  }
}
```

### Tags processing: AddTag и UseTag

The aom documentation supports grouping data by tags. To create a tag, it is necessary for the
class - route node - to apply the `@AddTag` decorator, which takes the `TagObject` data structure
as an argument:

```ts
interface TagObject {
  name: string; // tag name
  description?: string; // tag description
  externalDocs?: ExternalDocumentationObject; // external document object (https://swagger.io/specification/#external-documentation-object)
}
```

In order to apply the created tag, you need to add it to the `middleware` or `endpoint` function
using the `@UseTag` decorator.

The tag applied to the middleware applies to all endpoints of the route, until it is replaced
by another tag on the route, or merged with it, if special rules are set (details below).

Example:

```ts
@AddTag({ name: "File processing", description: "Standart methods for files" })
@Use(Files.Init)
class Files {
  @Get()
  @Summary("Files list")
  static Index() {
    return fs.readdirSync(__dirname);
  }

  @Post()
  @Summary("File upload")
  static Upload(@Files("file") file: File) {
    const filename = path.join(__dirname, file.name);
    fs.renameSync(file.path, filename);
    return filename;
  }

  @Middleware()
  @UseTag(Files) //
  static Init(@Next() next) {
    return next();
  }
}
```

All methods in the `Files` route node will be tagged with the `File processing`.

#### Tagging priority: IgnoreNextTags, ReplaceNextTags, MergeNextTags

A tag set with `@UseTag` to `endpoint` has the highest priority and cannot be overridden.
At the same time, tags applied to `middleware`, although they apply to all "underlying "functions,
can be replaced, ignored or combined with tags that may appear "further down the list".

Let's consider an example:

```ts
// ... root.ts

@Bridge("/users", Users)
@Bridge("/files", Files)
@AddTag({ name: "Basic methods" })
class Root {
  @Get("/docs.json")
  @Summary("Documentation")
  static Docs() {
    return docs;
  }

  @Get("/routes")
  @Summary("Routes list")
  static Routes(@Routes() routes) {
    return routes;
  }
}

// ... users.ts
@AddTag({ name: "Users list processing" })
@Bridge("/user_:user_id", User)
@Use(Users.Init)
class Users {
  @Summary("Users list")
  @Get()
  static Index() {
    return models.Users.find();
  }

  @Summary("Add new user")
  @Post()
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }

  @UseTag(Users)
  @Middleware()
  static Init(@Next() next) {
    return next();
  }
}

// ... user.ts
@AddTag({ name: "Single user processing" })
@Use(User.Init)
class User {
  user: models.Users;

  @Summary("User info")
  @Get()
  static Index(@This() { user }: User) {
    return user;
  }

  @Summary("Delete user")
  @Delete()
  static Delete(@This() { user }: User) {
    const result = await user.delete();
    return result;
  }

  @UseTag(User)
  @Middleware()
  static async Init(@This() _this: User, @Params("user_id") userId, @Next() next) {
    _this.user = await models.Users.findById(userId);
    return next();
  }
}

// ... files.ts
@AddTag("Files list processing")
@Bridge("/file_:file_id", File)
@Use(Files.Init)
class Files {
  where = {}; // files search criterias

  @Summary("Files list")
  @Get()
  static Index(@This() _this: Files) {
    return models.Files.find(where);
  }

  @UseTag(Files)
  @Middleware()
  static Init(@Next() next) {
    return next();
  }
}

// ... file.ts
@AddTag("Single file processing")
@Use(File.Init)
class File {
  file: models.Files;

  @Summary("File info")
  @Get()
  static Index(@This() { file }: Files) {
    return file;
  }

  @Summary("Delete file")
  @Delete()
  static Delete(@This() { file }: Files) {
    return file.remove();
  }

  @UseTag(File)
  @Middleware()
  static Init(
    @This() _this: File,
    @Params("file_id") fileId,
    @StateMap(Files) { where }: Files,
    @Next() next
  ) {
    _this.file = await models.Files.find({ _id: fileId, ...where });
    return next();
  }
}
```

By default, for all tags will be applied rule `ReplaceNextTags`. It means that as you "deep" into
the chain of functions, each new tag encountered will replace the previous one.

Thus, in the above example, the default rule will work for all tags, and each group of requests
will be correctly marked with a tag of its own class, which will be propagated to them through
the initiated middleware.

That is, the tagging of `endpoints` will be as follows:

```
> Basic methods
  -- GET /docs.json
  -- GET /routes
> Users list processing
  - GET /users
  - POST /users
> Single user processing
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Files list processing
  - GET /files
> Single file processing
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

Let's consider a situation when it is necessary to extend the functionality of the `User`
route node by adding the ability to work with files belonging to this user, in the same methods
as for other files.

```ts
// ... user.ts
@AddTag({ name: "Single user processing" })
@Use(User.Init)
class User {
  user: models.Users;

  @Summary("User info")
  @Get()
  static Index(@This() { user }: User) {
    return user;
  }

  @Summary("Delete user")
  @Delete()
  static Delete(@This() { user }: User) {
    const result = await user.delete();
    return result;
  }

  // create a bridge to the `Files` route node
  @Bridge("/files", Files)
  static files(@Next() next, @This() { user }: User, @StateMap() stateMap) {
    // add an instance of the Files class to StateMap,
    // which will have special search criteria set only for those files that belong to the context user
    const userFiles = new Files();
    files.where = { userId: user._id };
    stateMap.set(Files, userFiles);
    return next();
  }

  @UseTag(User)
  @Middleware()
  static async Init(@This() _this: User, @Params("user_id") userId, @Next() next) {
    _this.user = await models.Users.findById(userId);
    return next();
  }
}
```

As a result of this modification a situation arises that after connecting the bridge to
the tag "Files list processing" ( `@UseTag(Files)`) and the "Single file processing"
(`@UseTag(File)`) will fall as the methods that are provided in the context of work with the user.

That is, the list of methods in tags will become as follows:

```
> Basic methods
  -- GET /docs.json
  -- GET /routes
> Users list processing
  - GET /users
  - POST /users
> Single user processing
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Files list processing
  - GET /files
  - GET /users/user_{user_id}/files
> Single file processing
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
```

Obviously, this tagging is not entirely correct, and it is expected that the methods
of working with user files will be somehow tied to the context of the "Single user processing" tag.

To modify the tag processing logic, there are three decorators applied to the
`middleware`- or` bridge`-functions:

- `@IgnoreNextTags()` - all tags following this decorator are ignored. The last active tag is
  used for marking.
- `@MergeNextTags()` - all tags following this decorator are merged with the last active tag.
  In this case, the number of further tags can be more than 1, and all of them will be combined
  sequentially. For merging, the symbol stored in the `mergeSeparator` property of an instance
  of the` OpenApi` class is used. The default is `+`.
- `@ReplaceNextTags()` - the subsequent tag as well as all further ones replace the last
  active tag ("default" mode )

Apply the decorator `@IgnoreNextTags()` to the `bridge`-function into `User.files`:

```ts
class File {
  // ....
  // create a bridge to the `Files` route node
  @Bridge("/files", Files)
  @IgnoreNextTags()
  static files(@Next() next, @This() { user }: User, @StateMap() stateMap) {
    // add an instance of the Files class to StateMap,
    // which will have special search criteria set only for those files that belong to the context user
    const userFiles = new Files();
    files.where = { userId: user._id };
    stateMap.set(Files, userFiles);
    return next();
  }
  // ...
}
```

Then the structure of the routes belonging to tags will be as follows:

```
> Basic methods
  -- GET /docs.json
  -- GET /routes
> Users list processing
  - GET /users
  - POST /users
> Single user processing
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
  - GET /users/user_{user_id}/files
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
> Files list processing
  - GET /files
> Single file processing
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

If we use the `@MergeNextTags()` decorator, we get the following structure:

```
> Basic methods
  -- GET /docs.json
  -- GET /routes
> Users list processing
  - GET /users
  - POST /users
> Single user processing
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Single user processing+Files list processing
  - GET /users/user_{user_id}/files
> Single user processing+Files list processing+Single file processing
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
> Files list processing
  - GET /files
> Single file processing
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

Depending on preference and applied methodologies, you can choose one or another tagging strategy.

The decorators `@IgnoreNextTags()`, `@MergeNextTags()` and `@IgnoreNextTags()` work on the principle
of switches: that is, each subsequent one replaces the action of the previous one, and new rules
take effect after it. Thus, you can combine combinations of merging, replacements, or the use of
the last active tag.

### Security protocol processing: AddSecurity and UseSecurity

To add information about the security protocols used decorator `@AddSecurity()`, applied
to a class - of routing node, create a data layer, requiring the implementation of this Protocol.

The `@AddSecurity()` decorator takes as an argument an object that matches the `SecuritySchemeObject`
structure from the `openapi3-ts` library and matches the description for OAS documentation for
[`Security Scheme Object`](https://swagger.io/specification/#security-scheme-object).

To connect the created security protocol, it is necessary to add the `@UseSecurity()` decorator
to the `middleware`-function, after which the specified rules take effect, passing the class that
initiates this protocol as an argument.

Example:

```ts
// describe a schema that corresponds to the authorization of bearer token
const BearerSecuritySchema = {
  type: "http",
  in: "header",
  name: "Authorization",
  scheme: "bearer",
};

// define that the protocol "bearer" is the class `Auth`
@AddSecurity(BearerSecuritySchema)
export class Auth {
  user: models.Users;
  // ...
  @Post()
  @Summary("Login/password authentication")
  @Responses(
    { status: 200, description: "Success authentication", schema: models.Token },
    { status: 500, description: "Authentication error", schema: ErrorResponse }
  )
  @RequestBody({ description: "Login/password", schema: AuthForm })
  static async Login(@Body() { login, password }, @Next() next, @Err() err) {
    const authData = await models.Auth.checkAuth(login, password);
    if (models.Auth) {
      const token = await models.Token.generateToken(authData);
      return token;
    } else {
      return err("Wrong authentication data");
    }
  }

  // create a layer that requires a valid token for further actions
  @Middleware()
  @UseSecurity(Auth) // specify which security protocol is used
  @Responses({ status: 403, description: "Access denied", schema: ErrorResponse })
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
      return err("Wrong token");
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
// all methods in the route node `Account` require authorization
// and they are used the BearerToken security scheme related to the `Auth` class
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

**Important**: Currently, there is no full support for the `OAuth` protocol, which implies
the presence of specific read/write/delete permissions.

## Futher development

`aom` is in open beta and will be expanded with new features. Errors are not excluded, as well
as replacement and renaming of a number of functions and decorators. All requests, questions and
bug reports in the github [Issues](https://github.com/scarych/aom/issues)

In the plans:

- JSDoc documentation
- implementation of decorators for api-services in `express` (similar to` koa`)
- decorators to extend the databases functionality (`mongoose`,` typeorm`)
- development of functionality for microservices support (`kafkajs`)
- development of functionality for support `GraphQL`
- adding the ability to create multilingual OpenApi documentation
