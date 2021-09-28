---
title: Working with Koa
sidebar_position: 1
---

# aom/koa

At the present time realised the functionality based on http-framework
[`koa@2`](https://www.npmjs.com/package/koa).

The construction of a route map is using a set of decorators that differ in types:

- `endpoints` - to indicate the endpoints of the route. Includes decorators:
  `Endpoint`,`Get`, `Post`, `Patch`, `Put`, `Options`, `Delete`, `All`
- `middlewares` - to indicate middleware-functions, "bridges" and expansion of the context.
  The list includes to itself: `Middleware`, `Use`, `Bridge`, `Marker` and `Sticker`
- `parameters` - for parameterization of incoming arguments, used to get typical or
  specialized values ​​into middlewares or endpoints functions. The list includes but
  not limited to these values: `Args`, `Ctx`, `Body`, `Query`, `Session`, `State`,
  `Headers`, `Param`, `Files`, `Next`, `Req`, `Res`, `Route`, `Cursor`, `StateMap`, `This`.
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
to compose autodocumentation in the format [`OpenApi`](../openapi/index), and to have more
structured and understandable code, convenient for refactoring and data control.

## How does this works

A route node - is a class responsible for a local fragment of a route map. All elements of the route
node become available after it is connected to another node.

After assembly, route nodes unfolds in a sequence of `middleware` functions, which ends by the final
`endpoint`, thereby creating a complete structure of all routes, described in communication nodes.

Route nodes are created so that their elements can be reused in other parts of the routes, including
another api-services.

All `endpoint`-, `middleware`- and `bridge`-functions are created above the static methods of the class,
while the methods and properties of instances can be applied as contextual data items, which accessed
via decorators [`StateMap`](./parameters#statemap) and [`This`](./parameters#this).

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
import { $ } from "aom"; // assembler of routes map
import Index from "./routes"; // root route node

const app = new koa();
const router = new router();

// initiate the assembly of routes: the first argument is the root node, the second is the prefix
// a custom route node can be used as a root node
// in this case, only those links will be activated that are connected directly with it
// prefix allows you to set a common prefix for all addresses on the route,
// for example `/ v1` to specify API versioning, by default` / `,
export const $aom = new $(Index, "/");

// get a list of addresses, methods and middlewares functions
// collection of [{method: string, path: string, middlewares: Function []}]

// apply the routes to the koa-router instance
$aom.routes.forEach(({ method, path, middlewares }) => {
  router[method](path, ...middlewares);
});

// alternative way: pass to the handler method using the same values
// and apply them to the used router
$aom.eachRoute(({ method, path, middlewares }) => {
  router[method](path, ...middlewares);
});

// transfer data from the router to the server
app.use(router.routes()).use(router.allowedMethods());

// run server on neccessary port
app.listen(3000);
```

If necessary, you can use other `koa` stack libraries, creating the necessary middleware before
or after connecting routes on the `aom/koa` decorators.
