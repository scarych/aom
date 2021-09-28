# AOM: API Over Models

`aom` - it is meta-framework made of typescript-decorators, which allows to fast and comfortable
create safe api-services, using the principle of accumulation data layers, enriched with abstractions.

## Installation

```
npm i -s aom
```

or

```
yarn add aom
```

## Getting started

To check out the documentation, visit [aom.js.org](http://aom.js.org) (`en` and `ru` available)

## Concept

The main idea sounds like: "don't duplicate the code, link the code". `aom` allows to use data
proccessing, made to cover most cases you need. At the same time `aom` do not limit the developer
in frames of the only framework, but gives the ability to use third-party libraries and packages.

`aom` is not a "thing in itself "- a framework that operates exclusively on its own codebase and only
works in its own environment. Its important feature is the ability to combine with the "classic" code
on `koa`, which makes it useful when migrating functionality already existing projects.

`aom` does not run code in an isolated environment, but generates structures that are compatible with
popular libraries: `koa-router`, `koa-session` and others, which allows, if necessary,
keep the existing code-stack, and comfortably extend it in the `aom` +`typescript` methodology.

**Code sample**

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

## Issues

Use [Github issues](https://github.com/scarych/aom/issues) to ask your question or report about
problem.

## Contacts

- Author: [Grigory Kholstinnikov](https://github.com/scarych)
- Email: [mail@scarych.ru](mailto:mail@scarych.ru)

## License

AOM is [MIT licensed](https://github.com/scarych/aom/blob/HEAD/LICENSE).

## Warning

`aom` is in open beta and will be expanded with new features. Errors are not excluded, as well
as replacement and renaming of a number of functions and decorators.
