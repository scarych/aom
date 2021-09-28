---
title: Использование Koa
sidebar_position: 1
---

# aom/koa

В настоящее время реализована функциональность для работы в рамках фреймворка
[`koa@2`](https://www.npmjs.com/package/koa).

Построение маршрутной карты осуществляется с применением набора декораторов, различающихся по типам:

- `endpoints` - для обозначения конечных точек маршрута. Включает в себя декораторы:
  `Endpoint`, `Get`, `Post`, `Patch`, `Put`, `Options`, `Delete`, `All`
- `middlewares` - для обозначения middleware-функций, "мостов" и расширения контекста. Список включает
  в себя: `Middleware`, `Use`, `Bridge`, `Marker` и `Sticker`
- `parameters` - для параметризации входящих аргументов, применяются для получения типовых или
  специализированных значений в `middleware`- или `endpoint`-функциях. Список включает в себя, но
  не ограничивается этими значениями: `Args`, `Ctx`, `Body`, `Query`, `Session`, `State`,
  `Headers`, `Param`, `Files`, `Next`, `Req`, `Res`, `Route`, `Cursor`, `StateMap`, `This`.
  Также допускается возможность создания собственных декораторов аргументов для реализации специальных логик.

Пример кода с декораторами `aom/koa`:

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

Приведенный выше код заменяет собой необходимость использовать перечень маршрутов "классического"
вида с соответствующим ограничениями в аргументации middleware (возможность использовать
только `async (ctx, next)=>{...}`):

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

Другие плюсы такого подхода состоят в возможности использовании дополнительных декораторов, которые
позволяют составить автодокументацию в формате [`OpenApi`](#../openapi/intro), и в целом является более
структурным и понятным, удобным для рефакторинга и контроля данных.

## Как это работает

Маршрутный узел - это класс, отвечающий за локальный фрагмент маршрутной карты. Все элементы маршрутного
узла становятся доступны после его подключения к другому узлу.

После сборки маршрутные узлы разворачиваются в последовательности `middleware`-функций, и заканчиваются
вызовом финального `endpoint`-а, создавая тем самым полную структуру всех маршрутов, использующих все
описанные в узлах связи.

Маршрутные узлы создаются с учетом того, чтобы их элементы могли быть повторно использованы
в других участках маршрута, в том числе другого api-сервиса.

Все `endpoint`-, `middleware`- и `bridge`-функции создаются над статическими методами класса, в то время
как методы и свойства экземпляров могут применяться в качестве контекстных элементов данных, доступ
к которым осуществляется через [`StateMap`](#statemap) и [`This`](#this).

Маршрутный узел не обладает собственным адресом доступа, и может быть подключен к другому элементу
через произвольное значение адреса или параметр, используя мосты `@Bridge`

Совокупность узлов и связей между ними создают маршрутную карту, которая может быть целиком или
фрагментарно применена к `koa-router`-у (или одному из его разновидностей), чтобы создать в
контексте приложения `koa` требуемый набор маршрутов.

Все маршруты формируют изолированные цепочки вызовов `(ctx, next)=>{...}`, в рамках которых ограничиваются
данные, используемые в различных запросах. Можно сказать, что в общем случае формируются и выполняются
цепочки, состоящие из `middleware`, и оканчивающиеся `endpoint`-ом, вида:

```ts
router[method](url, ...[Route1.Middleware1, Route2.Middleware2, Route3.Bridge, Route4.Endpoint]);
```

Подключение маршрутных узлов к серверу на `koa` происходит следующим образом:

```ts
import koa from "koa";
import koaRouter from "koa-router";
import { $ } from "aom"; // сборщик маршрутной карты
import Index from "./routes"; // корневой маршрутный узел

const app = new koa();
const router = new router();

// инициируем сборку маршрутов: первый аргумент - корневой узел, второй - префикс
// в качестве корневого узла может быть произвольно взятый узел
// в этом случае будут активированы только те связи, которые связаны непосредственно с ним
// префикс позволяет установить общий префикс для всех адресов на маршруте,
// например `/v1` для указания версионности API, по умолчанию `/`,
export const $aom = new $(Index, "/");

// применим маршруты к используемому роутеру
// извлечем требуемые значения: method, path, middlewares
$aom.routes.forEach(({ method, path, middlewares }) => {
  router[method](path, ...middlewares);
});

// альтернативный способ
$aom.eachRoute(({ method, path, middlewares }) => {
  router[method](path, ...middlewares);
});

// перенесем данные из роутера в сервер
app.use(router.routes()).use(router.allowedMethods());

// запустим сервер на указанном порту
app.listen(3000);
```

При необходимости можно использовать другие библиотеки стека `koa`, создавая нужные middleware перед
или после подключения маршрутов на декораторах `aom/koa`.




