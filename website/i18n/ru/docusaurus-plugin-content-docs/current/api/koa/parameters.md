---
title: Декораторы аргументов
sidebar_position: 4
---

# Декораторы аргументов

Все методы, участвующие в маршрутных участках должны использовать декорированные аргументы, чтобы корректно
оперировать контекстом действий. Все декораторы возвращают изолированные значения в контексте текущего запроса.

## Args

Базовый декоратор `@Args` позволяет получить общую структуру данных, являющихся текущим контекстом
выполняемого запроса.

В общем виде эта структура имеет вид:

```ts
interface IArgs {
  ctx: Context;
  next: Next;
  route: IRoute;
  cursor: ICursor;
}
```

Где:

- `ctx` и `next` - типовые значения, которыми оперирует `koa`
- `route` - структура, указывающая на конечную точку маршрута
- `cursor` - структура, указывающая на текущую точку маршрута

Остановимся подробнее на `cursor` и `route`, так как они играют важную роль в организации структур
маршрутов.
Структура `cursor` имеет вид:

```ts
interface ICursor {
  constructor: Function; // класс, который в данный момент вызывается
  property: string; // имя метода, который в данный момент исполняется
  handler: Function; // собственно функция, которая в данный момент исполняется (handler === constructor[property])
  prefix: string; // префикс участка маршрутного пути, который в данный момент проходит курсор
}
```

Структура `route` имеет вид:

```ts
interface IRoute {
  constructor: Function; // класс, который содержит конечную точку маршрута
  property: string; // имя метода, который будет вызван в конечной точке маршрута
  handler: Function; // собственно функция, которая будет вызвана в конечной точке маршрута (handler === constructor[property])
  method: string; // метод, который применяется для конечной точки
  path: string; // полный путь маршрута (в виде паттерна с параметрами `/files/:filename`)
  cursors: ICursor[]; // список всех курсоров, составляющих данный маршрут
  middlewares: Function[]; // список скомплированных функций, запускающихся для данного endpoint в контексте `koa` (функции `(ctx, next)=> {...}`)
}
```

Рассмотрим пример вызова метода `GET /users/user_:id`, который в общем случае составлен из цепочки
задекорированных при помощи `@Middleware`, `@Bridge` и `@Endpoint` статичных методов трех классов:

```ts
[Root.Init, Users.Init, Users.UserBridge, User.Init, User.Index];
```

При обращении к данному маршруту будут последовательно вызваны все функции цепочки, и в случае, если
каждая из них корректно вернет `next`-значение, будет вызвана конечная функция, в которой ожидается
результат.

На любом из участков маршрута в любой middleware значение `route` будет иметь вид:

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

Таким образом в любом месте маршрута можно получить информацию о точке назначения, и при необходимости
выполнить какие-либо проверки или залогировать действия.

Значение `cursor` в каждом месте маршрута будет отличаться.
Для первого элемента он будет равен:

```ts
{
  constructor: Root,
  property: `Init`,
  handler: Root.Init,
  prefix: '/'
}
```

Для второго элемента он будет равен:

```ts
{
  constructor: Users,
  property: `Init`,
  handler: Users.Init,
  prefix: '/users'
}
```

Для третьего:

```ts
{
  constructor: Users,
  property: `UserBridge`,
  handler: Users.UserBridge,
  prefix: '/users/user_:id'
}
```

Для четвертого:

```ts
{
  constructor: User,
  property: `Init`,
  handler: User.Init,
  prefix: '/users/user_:id'
}
```

Для пятого:

```ts
{
  constructor: User,
  property: `Index`,
  handler: User.Index,
  prefix: '/users/user_:id'
}
```

Таким образом на каждом шаге маршрута может быть получена рефлексивная информация о том, кто и на каком
участке его обрабатывает. Может быть использовано для логирования, контроля доступа к маршрутам, а также
к сохранению и применению контекстных данных на любом из его участков.

Наличие в `route` и `cursor` значения `constructor` дает возможность использовать значения из структуры
`ctx.$StateMap = new WeakMap`, которые более подробно рассматриваются в описании к декораторам
[`StateMap`](#statemap) и [`This`](#this).

Значения объекта `route` одинаково для всех точек на ветке маршруте. Значения в структуре `route`
могут быть расширены за счет декоратора [`@Marker`](./middlewares#marker) (описан ниже)

Для объекта `cursor` значение `constructor` может быть изменено в особом случае: если применяется
декоратор перегрузки [`Sticker`](./middlewares#sticker) (описан ниже)

Декоратор `Args` позволяет принять на вход функцию, которой будет передана структура аргументов `IArgs`,
из которых могут быть извлечены и возвращены специфические значения. Допускается применение асинхронных функций.
Пример:

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

Допускается создание собственных декораторов аргументов, используя вызов `Args`

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

Все существующие декораторы аргументов являются частными случаями применения декоратора `@Args`:

## Ctx

Декоратор `@Ctx()` - возвращает стандартный для `koa` объект `ctx`, к которому могут быть применены
его типовые методы, извлечены стандартные или, если использовались специфические библиотеки,
особые значения.

## Req, Res

Декораторы `@Req()` и `@Res()` возвращают стандартные для `koa` объекты `ctx.req` и `ctx.res`
соответственно. Не принимают никаких аргументов, позволяют на низком уровне работать с контекстом.

## Next

Декоратор `@Next()` позволяет получить специальную `next`-функцию.

В общем случае `next`-функция используется аналогично стандартной `next`-функции `koa`: указывает,
что далее ожидается результат из следующей функции в цепочке. Чаще всего применяется в качестве
значения, возвращаемого в `middleware`.

При использовании аргументов `next`-функция позволяет вернуть результат из другого `endpoint`
или `middleware`. В качестве аргументов принимает последовательность статичных методов, являющихся
точкой назначения или прослойкой.

Пример:

```ts
@Use(User.Init)
class User {
  data: any;

  @Middleware()
  static async Init(@Params("user_id") userId, @This() user: User, @Next() next) {
    user.data = await models.Users.findById(userId);
    return next(); // при вызове без аргументов указывает, что ожидается следующая функция в цепочке
  }

  @Get()
  static Info(@This() { data }: User) {
    return data;
  }

  @Patch()
  static async Update(@This() { data }: User, @Body() body, @Next() next) {
    const { _id } = data;
    await models.Users.update({ _id }, { $set: body });
    // может принимать в качестве аргументов цепочку middleware и endpoint
    // выполняет их последовательно и возвращает результат, соответствующий последнему значению в цепочке
    // прерывает выполнение в случае ошибки
    return next(User.Init, User.Info);
  }
}
```

## Err

Декоратор `@Err()` возвращает `error`-функцию. В общем случае `aom` отреагирует на `throw` в произвольном
месте цепочки вызовов, и вернет ее как 500 ошибку (или использует значение `status` из объекта ошибки).

`error`-функция, полученная декоратором `@Err` позволит вернуть ошибку с указанным кодом `status`
и дополнительной информацией `data`.

Декоратор может принимать аргументом конструктор ошибки, который будет создан при генерации ошибки.
**Важно**: конструктор ошибки должен быть унаследован от класса `Error`.

Создаваемая `error`-функция при вызове использует аргументы:

- message: string - сообщение об ошибке, обязательно
- status?: number - код ошибки, по умолчанию 500
- data?: any - произвольная структура с данными об ошибке

Функцию можно вернуть через `return` или `throw`.
Пример:

```ts
import { Params, Err, Next, Middleware } from "aom";

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
      // вернет ошибку с кодом 404 и сообщением "user not found"
      // в качестве data будет значение объект с параметром, не прошедшим проверку
      // будет создан экземпляр класса ErrorReponse
      return err("user not found", 404, { user_id: userId });
    }
  }
  // или
  @Middleware()
  static async Init(@Params("user_id") userId, @Err() err, @Next() next) {
    const user = await models.Users.findById(userId);
    if (user) {
      return next();
    } else {
      // вернет ошибку с кодом 404 и сообщением "user not found", в качестве data будет значение
      // в качестве ошибки будет экземпляр класса Error
      return err("user not found", 404, { user_id: userId });
    }
  }
}
```

### Другие способы перехвата ошибок

Вызов задекорированных методов в `aom` происходит внутри конструкции `try { } catch (e) { }`: таким образом
любой `throw` будет интерпретирован как ошибка на маршруте, даже если был вызван сторонней библиотекой,
и будет возвращен в качестве значения `ctx.body = e`, прервав выполнение маршрута.

Вместо вызова `error`-функции также можно возвращать экземпляр ошибки: `aom` проверяет, если
возвращаемое значение является объектом ошибки, то прекратит выполнение маршрута, и вернет ошибку
с кодом 500, или со значением `status`, если таковое присутствует в значении.

Таким образом, вместо `error`-функции можно использовать собственный тип ошибок, который унаследован
от класса `Error`.

Например:

```ts
// ... используем класс ErrorResponse, описанный выше
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

Декоратор `@Query()` позволяет получить значение `ctx.query`, типичное для `koa`.

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

Декоратор может принимать в качестве аргумента функцию-обработчик, в которой можно преобразовать
или проверять значения входящего объекта.

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

Декоратор `@Body()` позволяет получить значение `ctx.request.body`, типичное для `koa`.

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

Декоратор может принимать в качестве аргумента функцию-обработчик, в которой можно преобразовать
или проверять значения входящего объекта.

```ts
// использутся `class-transformer` и `class-validator`, подразумевая, что в модели данных
// применяются соответствующие декораторы
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
// разрешается использовать асинхронные функции
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
    // в `userData` заведомо точно будут безопасные данные, которые можно добавлять в базу
    return models.Users.create({ ...userData });
  }
}
```

## Params

Декоратор `@Params()` позволяет получить значения `ctx.params`, типичное для `koa`. Может принимать
в качестве аргумента имя параметра, возвращая его значение.

```ts
import { Get, Middleware, Params, Next } from "aom";

class User {
  @Middleware()
  static async Init(@Params() params, @Next() next) {
    const user = await models.Users.findById(params.user_id);
    return next();
  }
  // или
  @Middleware()
  static async Init(@Params("user_id") userId, @Next() next) {
    const user = await models.Users.findById(userId);
    return next();
  }
}
```

## Headers

Декоратор `@Headers()` позволяет получить значения `ctx.headers`, типичное для `koa`. Может принимать
в качестве аргумента имя заголовка, возвращая его значение.

```ts
import { Get, Headers, Middleware, Next } from "aom";

class Auth {
  @Middleware()
  static async Init(@Headers() headers, @Next() next) {
    const checkToken = await models.Auth.checkToken(headers.authorization);
    return next();
  }
  // или
  @Middleware()
  static async Init(@Headers("authorization") authToken, @Next() next) {
    const checkToken = await models.Auth.checkToken(authToken);
    return next();
  }
}
```

## State

Декоратор `@State()` позволяет получить значения `ctx.state`, типичное для `koa`. Может принимать
в качестве аргумента имя аттрибута, возвращая его значение.

```ts
import { Get, State, Params, Middleware, Next } from "aom";

@Use(User.Init)
class User {
  // сохраним значение в state
  @Middleware()
  static async Init(@State() state, @Params("user_id") userId, @Next() next) {
    state.user = await models.Users.findById(userId);
    return next();
  }

  // извлечем значение из state
  @Get()
  static async Index(@State("user") user) {
    return user;
  }
}
```

## Session

Декоратор `@Session()` позволяет получить значения `ctx.session`, типичное для `koa`. Может принимать
в качестве аргумента имя аттрибута, возвращая его значение.

**Важно**: необходимо использовать middleware-библиотеки для использования сессий в `koa`
(например: [`koa-session`](https://www.npmjs.com/package/koa-session))

Пример:

```ts
import { Middleware, Post, Delete, Session, Body } from "aom";

@Use(Basket.Init)
class Basket {
  // убедимся, что есть список для хранения товаров в корзине
  @Middleware()
  static Init(@Session() session, @Next() next) {
    if (!session.basket) {
      session.basket = [];
    }
    return next();
  }
  // добавим предмет в корзину
  @Post()
  static async AddItem(@Body() item, @Session("basket") basket) {
    basket.push(item);
    return basket;
  }

  // очистим корзину
  @Delete()
  static async Clear(@Session() session) {
    session.basket = [];
    return basket;
  }
}
```

## Files

Декоратор `@Files()` позволяет получить данные из `ctx.request.files`, типичного для большинства
библиотек `koa`, позволяющего загружать файлы.

**Важно**: необходимо использовать middleware-библиотеки для загрузки файлов в `koa`
(например: [`koa-body`](https://www.npmjs.com/package/koa-body))

```ts
import { Post, Files } from "aom";
import fs from "fs";
import path from "path";

class Files {
  // загрузка одного файла
  @Post()
  static UploadFiles(@Files("file") file: File) {
    const filename = path.join(__dirname, file.name);
    fs.renameSync(file.path, filename);
    return file;
  }
  // загрузка нескольких файлов
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

Декоратор `@Cursor()` позволяет получить значение `cursor`, описанное выше.

## Route

Декоратор `@Route()` позволяет получить значение `route`, описанное выше.

## StateMap

`aom` расширяет контекстное значение `koa` специальной конструкцией `ctx.$StateMap = new WeakMap()`, которое
позволяет сохранять в контексте связи, основанные на ассоциациях с абстрактными ключами. В частности
для `aom` это позволяет сохранять ассоциации на классах, образующих маршрутные узлы.

Наиболее частый способ применения `@StateMap()` - сохранение в `middleware`-функции локальные состояния
экземпляров класса с последующим их применением в других методах.

Декоратор `StateMap` может принимать аргумент, который вернет из хранилища значение по ключу, равному этому
аргументу.

Пример:

```ts
class Auth {
  user: models.Users;
  login: models.UserLogins;
  // создадим прослойку, которая по токену определяет, доступна ли пользователю авторизация
  // и если доступна, сохраняет в stateMap по ключу класса авторизационную информацию: пользователя и логин
  @Middleware()
  static Init(@Headers("authorization") token, @Next() next, @StateMap() stateMap, @Err() err) {
    const authData = models.Auth.checkToken(token);
    if (authData) {
      const auth = new this(); // поскольку метод вызывается с сохранением контекста, то `this` - это класс `Auth`
      auth.user = await models.Users.findById(authData.userId);
      auth.login = await models.UserLogins.findById(authData.userLoginId);
      stateMap.set(this, auth);
    } else {
      return err("wrong auth", 403, { token });
    }
  }
}
// ... затем извлечем доступ к авторизационной информации в другом middleware или endpoint

@Use(Auth.Init) // отметим, что для доступа к маршрутному узлу обязательна успешная авторизация
class Account {
  // этот метод будет гарантированно вызван, если авторизация по токену была успешно совершена
  // а значит в StateMap будет значение по ключу Auth, являющееся экземпляром этого класса
  // с установленными значеними
  @Get()
  static async Index(@StateMap(Auth) auth: Auth, @Next() next) {
    const { user, login } = auth;
    // поскольку user - это объект модели данных `models.Users`, то для него доступны все его методы
    const stat = await user.getStat();
    return { user, login, stat };
  }
}
```

Использование `WeakMap` обусловленно критериями скорости и оптимизации памяти для хранения значений.
При желании его можно перегрузить, создав `middleware`, в котором будет использовано хранилище `Map`.

Например:

```ts
@Use(Root.Init) // Root.Init будет вызываться перед всеми запросами во всех маршрутных ветках
@Bridge("/files", Files)
@Bridge("/users", Users)
class Root {
  @Middleware()
  static Init(@Ctx() ctx, @Next() next) {
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

Декоратор `@This()` является расширением декоратора `@StateMap()`. Он проверяет, есть ли в `ctx.$StateMap`
значение по ключу, равного значению `constructor` в текущем `cursor`. Таким образом в общем случае он
проверяет, есть ли в `StateMap` значение для текущего класса, который сейчас выполняет работу, и если нет,
создает его singletone-экземпляр и возвращает значение.

Наиболее частый способ применения декоратора `@This()` - использование в иницирующей `middleware`
и `endpoint`-ах одного и того же маршрутного узла.

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
    return user; // вернет { user, stat }
  }

  @Delete()
  static async Delete(@This() { user }: User) {
    const result = await user.delete();
    return result;
  }
}
```

Декоратор `@This()` может принимать в качестве аргумента, другой класс. В этом случае будет возвращено
значение для этого класса из `ctx.$StateMap`, а, если его там не было, будет создан и возвращен экземпляр
этого класса, с сохранением по указанному аргументу в `ctx.$StateMap`.

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

Таким образом, использование декоратора `@StateMap()` позволяет хранить по ключу произвольное значение,
в то время как `@This()` всегда возвращает singletone-экземпляр класса, переданного в аргументе или
в текущем курсоре.

**Важно**: все классы, для которых будет применяться декоратор `@This`, должны уметь создавать свои
экземпляры без аргументов, так как декоратор не поддерживает передачу каких-либо значений в конструктор.
