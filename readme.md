# AOM: API Over Models

`aom` - это мета-фреймворк из typescript-декораторов, которые позволяют быстро и удобно делать
безопасные api-сервисы, используя накопительные слои, обогащенные абстракциями.
Основная идея состоит в том, чтобы не писать повторно одни и те же операции и инструкции,
а использовать данные, сгенерированные на предыдущих этапах, которые удовлетворяют требованиям
общей структурности кода. И при этом не ограничивать разработчика рамками фреймворка, и дать
возможность использовать сторонние библиотеки и инструменты.

## aom/koa

В настоящее время реализована функциональность для работы в рамках фреймворка
[`koa@2`](https://www.npmjs.com/package/koa) с применением роутера
[`koa-router`](https://www.npmjs.com/package/koa-router) для маршрутизации запросов.

Построение маршрутной карты осуществляется с применением набора декораторов, различающихся по типам:

- `endpoints` - для обозначения конечных точек маршрута, включает в себя декораторы:
  `Endpoint`, `Get`, `Post`, `Patch`, `Put`, `Options`, `Delete`, `All`
- `middlewares` - для обозначения middleware-функций, "мостов" и расширения контекста. Список включает
  в себя: `Middleware`, `Use`, `Bridge`, `Marker` и `Sticker`
- `parameters` - для параметризации входящих аргументов, применяются для получения типовых или
  специализированных значений в `middleware`- или `endpoint`-функциях. Список включает в себя, но
  не ограничивается этими значениями: `Args`, `Ctx`, `Body`, `Query`, `Session`, `State`,
  `Headers`, `Param`, `Files`, `Next`, `Req`, `Res`, `Target`, `Cursor`, `Routes`, `StateMap`, `This`.
  Также допускается возможность создания собственных декораторов аргументов для реализации специальных логик.

### Как это работает

Маршрутный узел - это класс, отвечающий за локальный фрагмент маршрутной карты. Все элементы маршрутного
узла становятся доступны после его подключения к другому узлу.

После сборки маршрутные узлы разворачиваются в последовательности `middleware`-функций, и заканчиваются
вызовов финального `endpoint`-а, создавая тем самым полную структуру всех маршрутов, использующих все
описанные в узлах связи.

Маршрутные узлы создаются с учетом того, чтобы их элементы могли быть повторно использованы
в других участках маршрута, в том числе другого api-сервиса.
Все `endpoint`-, `middleware`- и `bridge`-функции создаются над статическими методами класса, в то время
как методы и свойства экземпляров могут применяться в качестве контекстных элементов данных, доступ
к которым осуществляется через [`StateMap`](#statemap) и [`This`](#this).

Маршрутный узел не обладает собственным адресом доступа, и может быть подключен к другому элементу
через произвольное значение адреса или параметр.

Совокупность узлов и связей между ними создают маршрутную карту, которая может быть целиком или фрагментарно
применена к `koa-router`-у (или одному из его разновидностей), чтобы создать в контексте приложения `koa`
требуемый набор маршрутов.

Все маршруты формируют изолированные цепочки вызовов `(ctx, next)=>{...}`, в рамках которых ограничиваются
данные, используемые в различных запросах. Можно сказать, что в общем случае формируются и выполняются цепочки,
состоящие из `middleware`, и оканчивающиеся `endpoint`-ом, вида:

```ts
router[method](url, ...[Route1.Middleware1, Route2.Middleware2, Route3.Bridge, Route4.Endpoint]);
```

### Конечные точки маршрута

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

Значение `url` может иметь несколько уровней вложенности, и даже содержать типовой `koa-router`-параметр,

Указанные декораторы применяется следующим образом:

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

Таким образом будет создан маршрутный элемент, обладающий методами: `GET /`, `POST /save` и
`GET /choose/:variant`; который, после подключения в маршрутную карту, предоставит к ним доступ
с учетом возможных префиксов.

### Декораторы аргументов

Все методы, участвующие в маршрутных участках должны использовать декорированные аргументы, чтобы корректно
оперировать контекстом действий. Все декораторы возвращают изолированные значения в контексте текущего запроса.

#### Args

Базовый декоратор `@Args` позволяет получить общую структуру данных, являющихся текущим контекстом выполняемого
запроса.
В общем виде эта структура имеет вид:

```ts
interface $Args {
  ctx: Context;
  next: Next;
  target: $Target;
  cursor: $Cursor;
  routes: $Target[];
}
```

Где `ctx` и `next` - типовые значения, которыми оперирует `koa` в своих вызовах, `target` - структура,
указывающая на конечную точку маршрута, `cursor` - структура, указывающая на текущую точку маршрута,
`routes` - полный список всех маршрутов с возможными маркерными расширениями.

Остановимся подробнее на `cursor` и `target`, так как они играют важную роль в организации структур
маршрутов.
Структура `cursor` имеет вид:

```ts
{
  constructor: Function; // класс, который в данный момент вызывается
  property: string; // имя метода, который в данный момент исполняется
  handler: Function; // собственно функция, которая в данный момент исполняется (handler === constructor[property])
  prefix: string; // префикс участка маршрутного пути, который в данный момент проходит курсор
}
```

Структура `target` имеет вид:

```ts
{
  constructor: Function; // класс, который содержит конечную точку маршрута
  property: string; // имя метода, который будет вызван в конечной точке маршрута
  handler: Function; // собственно функция, которая будет вызвана в конечной точке маршрута (handler === constructor[property])
  method: string; // метод, который сейчас
  path: string; // полный путь маршрута (в виде паттерна с параметрами `/files/:filename`)
}
```

Рассмотрим пример вызова метода `GET /users/user_:id`, который в общем случае составлен из цепочки
задекорированных при помощи `@Middleware`, `@Bridge` и `@Endpoint` статичных методов трех классов

```ts
[Root.Init, Users.Init, Users.UserBridge, User.Init, User.Index];
```

При обращении к данному методу будут последовательно вызваны все функции цепочки, и в случае, если каждая
из них корректно вернет `next`-значение, будет вызвана конечная функция, в которой ожидается результат.
На любом из участков маршрута в любой middleware значение `target` будет иметь вида

```ts
{
  constructor: User,
  property: `Index`,
  handler: User.Index,
  method: 'get',
  path: '/users/user_:id'
}
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

Для третьего

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

Таким образом на каждом шаге маршрута может быть получена рефлексивная информация о том, кто и на каком участке
его обрабатывает. Может быть использовано для логирования, контроля доступа к маршрутам, а также к сохранению
и применению контекстных данных на любом из его участков.

Наличие в `target` и `cursor` значения `constructor` дает возможность использовать значения из структуры
`ctx.$StateMap = new WeakMap`, которые более подробно рассматриваются в описании к декораторам
[`StateMap`](#statemap) и [`This`](#this).

Значения объекта `target` одинаково для всех точек на ветке маршруте. Для объекта `cursor` значение
`constructor` может быть изменено в особом случае: если применяется декоратор перегрузки
[`Sticker`](#sticker) (описан ниже)

Структура `routes` содержит список всех `target`, предоставляя полный перечень всех маршрутов, доступных
для данной конфигурации. Значения в структуре `target` могут быть расширены за счет декоратора
[`@Marker`](#marker) (описан ниже)

Декоратор `Args` позволяет принять на вход функцию, которой будет передана структура аргументов `$Args`,
из которых могут быть извлечены и возвращены специфические значения. Допускается применение асинхронных функций.
Пример:

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

Допускается создание собственных декораторов аргументов, используя вызов `Args`

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

Все существующие декораторы аргументов являются частными случаями применения декоратора `@Args`:

#### Ctx

Декоратор `@Ctx()` - возвращает стандартный для `koa` объект `ctx`, к которому могут быть применены
его типовые методы, извлечены стандартные или, если использовались специфические библиотеки,
особые значения.

#### Req, Res

Декораторы `@Req()` и `@Res()` возвращают стандартные для `koa` объекты `ctx.req` и `ctx.res` соответственно.
Не принимают никаких аргументов, позволяют на низком уровне работать с контекстом.

#### Next

Декоратор `@Next()` позволяет получить специальную `next`-функцию.

В общем случае `next`-функция используется аналогично стандартной `next`-функции `koa`: указывает,
что далее ожидается результат из следующей функции в цепочке.

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
    return next(User.Init, User.Info);
  }
}
```

#### Err

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
import { Params, Err, Next, Middleware } from "aom/koa";

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
      // вернет ошибку с кодом 404 и сообщением "user not found", в качестве data будет значение
      // в качестве ошибки будет экземпляр класса ErrorReponse
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

#### Query

Декоратор `@Query()` позволяет получить значение `ctx.query`, типичное для `koa`.

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

Позволяет передавать в качестве аргумента функцию-обработчик, в которой можно преобразовать или проверить
значения входящего объекта.

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

Декоратор `@Body()` позволяет получить значение `ctx.request.body`, типичное для `koa`.

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

Позволяет передавать в качестве аргумента функцию-обработчик, в которой можно преобразовать или проверить
значения входящего объекта.

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

#### Params

Декоратор `@Params()` позволяет получить значения `ctx.params`, типичное для `koa`. Может принимать
в качестве аргумента имя параметра, возвращая его значение.

```ts
import { Get, Middleware, Params, Next } from "aom/koa";

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

#### Headers

Декоратор `@Headers()` позволяет получить значения `ctx.headers`, типичное для `koa`. Может принимать
в качестве аргумента имя заголовка, возвращая его значение.

```ts
import { Get, Headers, Middleware, Next } from "aom/koa";

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

#### State

Декоратор `@State()` позволяет получить значения `ctx.state`, типичное для `koa`. Может принимать
в качестве аргумента имя аттрибута, возвращая его значение.

```ts
import { Get, State, Params, Middleware, Next } from "aom/koa";

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

#### Session

Декоратор `@Session()` позволяет получить значения `ctx.session`, типичное для `koa`. Может принимать
в качестве аргумента имя аттрибута, возвращая его значение.

**Важно**: необходимо использовать middleware-библиотеки для использования сессий в `koa`
(например: [`koa-session`](https://www.npmjs.com/package/koa-session))

Пример:

```ts
import { Middleware, Post, Delete, Session, Body } from "aom/koa";

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

#### Files

Декоратор `@Files()` позволяет получить данные из `ctx.request.files`, типичного для большинства библиотек `koa`,
позволяющего загружать файлы.

**Важно**: необходимо использовать middleware-библиотеки для загрузки файлов в `koa`
(например: [`koa-body`](https://www.npmjs.com/package/koa-body))

```ts
import { Post, Files } from "aom/koa";
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

#### Cursor

Декоратор `@Cursor()` позволяет получить значение `cursor`, описанное выше.

#### Target

Декоратор `@Target()` позволяет получить значение `target`, описанное выше.

#### Routes

Декоратор `@Routes()` позволяет получить значение `routes`, описанное выше.

#### StateMap

`aom` расширяет контекстное значение `koa` специальной конструкцией `ctx.$StateMap = new WeakMap()`, которое
позволяет сохранять в контексте связи, основанные на ассоциациях с абстрактными ключами. В частности для `koa`
это позволяет сохранять ассоциации на классах, образующих маршрутные узлы.

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
// ... затем извлечем получим доступ к авторизационной информации в другом middleware или endpoint

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

#### This

Декоратор `@This()` является расширением декоратора `@StateMap()`. Он проверяет, есть ли в `ctx.$StateMap`
значение по ключу, равного значению `constructor` в текущем `cursor`. Таким образом в общем случае он
проверяет, есть ли в `StateMap` экземпляр данного класса, который сейчас выполняет работу, и если нет, создает
его и возвращает.

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

Декоратор `@This()` может принимать аргументы, которые могут быть переданы в конструктор курсора, если тот
подразумевает наличие аргументов при создании экземпляра.

**Важно**: значения конструктора в этом случае будут быть отделены от контекста запросов. Если для создания
экземпляров важно использовать значения в контексте маршрутных вызовов, то следует использовать `@StateMap()`
с созданием аргументированных экземпляров внутри маршрутного вызова.

### Мосты (Bridge) и прослойки (Middleware)

Прослойки создаются при помощи декоратора `@Middleware()`: он не принимает аргументов, и просто позволяет
использовать указанный метод с любым другого элементом маршрутного узла: конечной точкой, мостом, прослойкой
или маршрутным узлом целиком.

Подключение `middleware` происходит при помощи декоратора `@Use()`, принимающего в качестве аргументов
последовательность `middleware`-функций: `@Use(Root.Init, Auth.Required, Users.Init)`.
Декоратор `@Use()` может быть применен к endpoint-у, маршрутному узлу целиком, другой прослойке или мосту.
Все прослойки всегда выполняются перед элементом, к которому они применены.

Для соединения маршрутных элементов между собой используются мосты, создаваемые декоратором `@Bridge`.
Аргументами к декоратору являются

- `prefix: string` - адресный префикс маршрута, может содержать параметр, контекстный целевому маршрутному
  элементу
- `nextRoute: Function` - следующий маршрутный узел: задекорированный класс, который может содержать другие
  мосты, прослойки и endpoint-ы

Декоратор `@Bridge` может применяться как к классу, так и к методу класса. В последнем случае метод класса
выступает как прослойка к подключаемому маршруту.

Все мосты подключаются после endpoint-ов текущего узла. Таким образом, если вдруг возникнет пересечение имен
и методов, то приоритет останется за методами, подключенными через `@Bridge`

Пример:

```ts
// ... index.ts
import { Get, Bridge } from "aom/koa";
import logger from "logger";
import Files from "./files";

@Bridge("/files", Files) // маршрутный узел Files доступен по префиксу `/files` относительно текущего узла
class Index {
  @Get()
  @Use(Root.Logger) // перед методом `GET /` будет использована прослойка с логированием
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

  @Bridge("/:filename", FileInfo) // ожидает параметр - имя файла - в качестве следующего фрагмента пути
  static prepare(
    @Params("filename") filename: string,
    @StateMap() stateMap: WeakMap<any, any>,
    @Err() err,
    @Next() next
  ) {
    // получим полное имя файла с учетом директории
    filename = path.join(__dirname, filename);
    // если файл найден
    if (fs.existsSync(filename)) {
      // создает экземпляр маршрутного узла
      const fileInfo = new FileInfo();
      // сохраняет в него полученное имя файла
      fileInfo.filename = filename;
      // и сохраняет в stateMap (контекстный объект WeakMap)
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

@Use(FileInfo.Init) // перед всеми методами узла выполняется прослойка `FileInfo.Init`
class FileInfo {
  filename; // полное имя файла
  info; // информация о файле

  @Get()
  static Index(@Ctx() ctx, @This() _this: FileInfo) {
    // установим тип возвращаемого контента согласно mime-type файла
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
    // поскольку заведомо точно известно, что данный файл существует
    // то получаем о нем информацию без проверок на ошибки
    _this.info = getFileInfo(_this.filename);
    return next();
  }
}
```

Мост может быть подключен с префиксом `/`: в этом случае все методы подключаемого узла будут находиться
в адресном пространстве узла, к которому происходит подключение.

#### Marker

Декоратор `@Marker()` позволяет обогатить информацию о точке назначения в маршрутной карте, указав,
что для элемент `target` в цепочке предшествующих ему `middleware` есть элементы `cursor` с определенными
значениями `prefix`.
Декоратор применяется на `middleware`-функцию, таким образом, что в момент, когда эта `middleware`
используется на любом из участков маршрутной карты, маркер применяется к конечной точке согласно правилам
функции маркировки.

Декоратор `@Marker()` принимает аргументом функцию маркировки, которая должна принимать два аргумента:
`target` и `cursor`. Курсором будет всегда прослойка, которая маркирует

Маркировка устанавливается в процессе сбора маршрутной карты и не оперирует контекстом. Наличие маркировки
в на элементе маршрута может служить основанием для дополнительных контекстных проверок: полномочий, прав доступа
и других составных операций.

Рассмотрим использование маркировки на примере контроля доступа к маршрутным точкам.

```ts
// создадим имя маркера
const accessMark = "check_access";

class Access {
  // прослойка, выполняющая проверку, что пользователю, авторизованному в контексте, разрешен
  // доступ к данному участку маршрута
  @Middleware()
  // укажем, что данная прослойка является маркером, использущим указанную функцию маркировки
  @Marker(Access.setMark)
  static Check(
    @StateMap(Auth) { user }: Auth, // авторизационные данные пользователя
    @Target() target, // точка назначения, из которой важно знать `path` и `method`
    @Cursor() cursor, // курсор, в котором важно знать значение `prefix`
    @Next() next,
    @Err() err
  ) {
    // если для пользователя выполняется проверка, то позволим пройти данную прослойку
    if (user.checkAccess(target, cursor)) {
      return next();
    } else {
      // иначе вернем ошибку 403
      return err("access denied", 403);
    }
  }
  // функция маркировки
  static setMark(target: $Target, cursor: $Cursor) {
    // если для элемента `target` нет требуемого маркера, то создадим его
    if (!target[accessMark]) {
      target[accessMark] = [];
    }
    // добавим текущий курсор в список
    target[accessMark].push = cursor;
  }
}
// ... применим созданный маркер
@Bridge("/users", Users)
class Root {
  @Get()
  static Index(@Routes() routes) {
    return routes;
  }

  @Get("/info")
  @Use(Access.Check)
  static Secure() {
    return "this route is secure";
  }
}

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

В результате данной операции в списке маршрутов `routes` появятся следующие значения

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

Кроме того, соответствующие значения будут доступны при обращении к `target` внутри контекстных вызовов.
Эту информацию можно использовать для визуализации структуры запросов и отображении тех из них, к которым
следует применить проверки контроля доступа.

#### Sticker

Декоратор `@Sticker()` используется в ситуациях, когда для создания маршрутных узлов используются типовые
классы, от которых наследуются активные маршрутные узлы.

Пример:

```ts
// для быстрого создания апи методов вокруг моделей данных каталога создадим класс
// который будет предоставлять стандартные middleware для этого сегмента данных
// каким-то образом безопасно фильтрующих входящие значения
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

  // используем только те значения, которые прошли безопасную внутренную проверку в модели данных
  static FilterQuery(model, query) {
    return model.safeQuery(query);
  }

  // используем только те значения, которые прошли безопасную внутренную проверку в модели данных
  static FilterBody(model, body) {
    return model.safeBody(body);
  }
}

// унаследуем от данного класса маршрутный узел для работы с категориями
class Categories extends Catalogs {
  model = models.Categories;

  @Get()
  // применим типовую фильтрацию данных для создания критериев поиска в модели данных
  @Use(Categories.SafeQuery)
  static Index(@This() _this) {
    return _this.model.find(_this.where);
  }

  @Post()
  // применим типовую фильтрацию данных для ограничения входящих значений
  @Use(Categories.SafeBody)
  static Add(@This() _this) {
    return _this.model.create(_this.body);
  }
}

// унаследуем от данного класса маршрутный узел для работы с брендами
class Brands extends Catalogs {
  model = models.Brands;

  @Get()
  // применим типовую фильтрацию данных для создания критериев поиска в модели данных
  @Use(Brands.SafeQuery)
  static Index(@This() _this) {
    return _this.model.find(_this.where);
  }

  @Post()
  // применим типовую фильтрацию данных для ограничения входящих значений
  @Use(Brands.SafeBody)
  static Add(@This() _this) {
    return _this.model.create(_this.body);
  }
}
```

Несмотря на то, что данный код не содержит комплируемых ошибок, он не будет работать корректным образом.
Ввиду особенностей механизма наследования классов в JS, функции `Brands.SafeBody` и `Brands.SafeQuery`
(равно как `Categories.SafeBody` и `Categories.SafeQuery`) будут фактически возвращать дескриптор функций
`Catalogs.SafeQuery` и `Catalogs.SafeBody`, и при вызове декоратор `@This` будет создавать экземпляр класса
`Catalogs`, а при обращении к методы `FilterQuery` и `FilterBody` возникнут ошибки, так как в контексте
класса `Catalogs` нет определенных моделей данных.

Для того, чтобы данный код заработал, необходимо для `middleware`-функций `Catalogs.SafeQuery`
и `Catalogs.SafeBody` добавить декоратор `@Sticker()`

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

  // используем только те значения, которые прошли безопасную внутренную проверку в модели данных
  static FilterQuery(model, query) {
    return model.safeQuery(query);
  }

  // используем только те значения, которые прошли безопасную внутренную проверку в модели данных
  static FilterBody(model, body) {
    return model.safeBody(body);
  }
}
```

В этом случае для отмеченных этим декоратором методов будет осуществляться проверка: является ли
`target.constructor` потомком `cursor.constructor`, и если да, то значение `cursor.constructor` в этом
методе будет заменено на значение `target.constructor` (значение будет как-бы "заклеено", отсюда название
декоратора).

Данная методика также работает только для `middleware`, и пока не подходит для `endpoint`. Таким образом,
что нельзя использовать мост на родительский класс с типовыми процедурами. Такая возможность появится позже.

## aom/openapi

Декораторы коллекции `aom/openapi` позволяют обогощать маршрутные узлы информацией, которая при сборке
формирует документацию в формате [`OAS3`](https://swagger.io/specification/), обеспечивая таким образом
естественную автодокументацию кода.

При генерации документации используется тот же принцип последовательной обработки участков маршрутных
узлов - прослоек, мостов - с накоплением релевантной информации и применением полученной совокупности
к конечной точке маршрута.

Таким образом, что если одна из прослоек при проверке данных генерирует ошибку `403`, то при ее описании
для этой middleware она распространится на информацию в структуре responses на все множество использующих
эту прослойку endpoint-ов. Аналогичное поведение будет при генерации информации о параметрах адресной
строки, протоколах безопасности.

**Важно**: далее в этой документации будет упоминаться тип данных `SchemaObject`. В данном случае
это означает применение интерфейса из библиотеки `openapi3-ts`, означающий типовую конфигурацию
схемы данных объекта в спецификации `openapi`.

```ts
import { SchemaObject } from "openapi3-ts";
```

### Методология формирования окружения

В своей основе `aom` стремится к сокращению количества используемого кода, и минимизации дубликатов структур
данных. Эти же принципы используются для того, чтобы максимально использовать возможности языка `JavaScript`
и обогатить используемые структуры данных окружением, которое позволит генерировать необходимый код по запросу.

Декораторы из `aom/openapi` применяются исключительно для маршрутных узлов, однако они принимают в
качестве значений своих аргументов указания на модели данных. Генерация файла документации происходит
при вызове метода `toJSON`, таким образом необходимо позаботиться, чтобы такие структуры данных
обладали возможностью возвращать валидную структуру, описывающую его в стандарте `JSON-schema`, используя
собственные методы `toJSON` (для классов или объектов)

Хорошей практикой можно считать использование декораторов из библиотек
[`class-validator`](https://www.npmjs.com/package/class-validator) и
[`class-validator-jsonschema`](https://www.npmjs.com/package/class-validator-jsonschema).

Например, в сочетании с использованием методологии `typeorm` или `typegoose` это позволяет создавать
конструкции следующего вида:

```ts
// пример с typeorm
// используем декораторы из библиотек "class-validator-jsonschema" и "class-validator"
import { targetConstructorToSchema, JSONSchema } from "class-validator-jsonschema";
import { IsEnum, IsOptional, IsString, IsEnum } from "class-validator";
// используем декораторы и базовые классы из typeorm
import { EventSubscriber, Entity, Column, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { Index, ObjectIdColumn } from "typeorm";
import { BaseEntity } from "typeorm";

enum YesNo {
  YES = "yes",
  NO = "no",
}
// опишем модели данных: создадим базовую модель, от которой будут унаследованы остальные
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

  // создадим статичный метод JSON, который позволит получить JSON-schema для текущего класса
  static toJSON(): SchemaObject {
    return targetConstructorToSchema(this);
  }
}

// создадим модель данных Files, унаследованую от базовой модели
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

Таким образом, когда будет использовано прямое обращение к классу Files, то при генерации JSON будет вызван
унаследованный им метод `static toJSON()`, который вернет корректное для спецификации `OAS3` значение с
описанием структуры данных.

Тот же принцип следует использовать и для частных случаев структур данных, которые могут использоваться
в ходе разработки: входящие значения или специфические ответы.

```ts
// пример для описания данных, характеризущих авторизацию пользователя
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

Также, вместо использования структур, генерирующих схему данных при помощи метода `toJSON`, можно использовать
объект с существующей схемой данных, в том числе содержащий ссылки на другие значения в документации.
В этом случае необходимо будет вручную контролировать целостность таких связей, что может осложнить разработку.

### Как это работает

Декораторы из `aom/openapi` описывают общие характеристики, которые будут включены в документацию.
Для получения конечной структуры следует использовать сборщик `aom/$`, в который необходимо передать
экземпляр класса `OpenApi`, с инициированной контекстной данному api-сервису информацией.

Затем данный класс, обогащенный в процессе декомпозиции маршрутных узлов релевантными данными, можно вернуть
в одном из методов инициированного API, либо передать в библиотеку типа `swagger-ui` в качестве источника
JSON-данных.

Подробнее о процессе сборки написано в соответствующем [разделе](#сборка)

Пример:

```ts
// ... openapi.ts
import { OpenApi } from "aom/openapi";
// создадим экземпляр класса документацией, с базовой информацией, контекстной данному api-сервису
export default new OpenApi({
  info: {
    title: "Тестовая документация",
    description: "Пример автодокументации, собираемой на декораторах к маршрутам",
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
  @Summary("Главная страница")
  @Get()
  static Index() {
    return "aom is working";
  }

  @Summary("Документация")
  @Description("Полная документация в формате [`OAS3`](https://swagger.io/specification/)")
  @Get("/openapi.json")
  static OpenApi() {
    return Docs; // будет автоматически преобразовано в JSON
  }
}
```

### Описание конечной точки маршрута: Summary и Description

Для описания конечной точки маршрута используются декораторы `@Summary()` и `@Description()`. Каждый из них
принимает в качестве аргумента строковое значение.

```ts
import { Summary, Description } from "aom/openapi";
import { Get, Post } from "aom/koa";

class Users {
  @Summary("Список пользователей")
  @Description("Возвращает список активных пользователей")
  @Get()
  static List() {
    return models.Users.find({ active: true });
  }

  @Summary("Добавить пользователя")
  @Description("Создает нового пользователя и возвращает информацию о нем")
  @Post()
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }
}
```

Описание метода не является накопительной информацией, и используется целенаправленно для каждой конечной
точки маршрута.

### Ответы: Responses

Информация о структуре возвращаемых в методе ответах создается декоратором `@Responses()`. Данный декоратор
позволяет накапливать множество вариантов ответов, если это подразумевается логикой маршрута.

В качестве аргументов принимает последовательность объектов, удовлетворяющих следующей структуре:

```ts
interface OpenApiResponse {
  status: number; // код ответа
  description: string; // описание ответа
  contentType?: string; // тип данных, по умолчанию `application/json`
  isArray?: boolean; // признак того, что возвращается список объектов (коллекция), по умолчанию `false`
  schema: SchemaObject | Function | any; // схема в формате JSON-schema, или объект, генерирующий JSON подходящего формата
}
```

Пример работы данного декоратора:

```ts
// опишем типовую ошибку, которая может быть возвращена
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
  // на уровне middleware добавим вариант ответа 403, который распространится на все endpoint-ы
  // требующие авторизации
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
  @Summary("Получить список пользователей")
  @Responses({
    status: 200,
    desciption: "Список пользователей",
    isArray: true,
    schema: models.Users,
  })
  static Index() {
    return models.Users.find();
  }

  @Post()
  @Summary("Добавить пользователя")
  @Responses(
    {
      status: 200,
      description: "Информация о пользователе",
      schema: models.Users,
    },
    { status: 500, description: "Ошибка добавления пользователя", schema: ErrorResponse }
  )
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }
}
```

Таким образом, что для методов маршрутного узла `Users` помимо объявленных для них ответов, будет добавлен
и вариант с ошибкой `403`, так как каждый из этих методов требует прохождения авторизации.

### Тело запроса: RequestBody

Декоратор `@RequestBody` позволяет добавить описание для структуры данных, передаваемой в методах
`post`/`put`/`patch`.

Декоратор принимает аргумент, имеющую структуру:

```ts
interface OpenApiRequestBody {
  description: string; // описание ответа
  contentType?: string; // тип данных, по умолчанию application/json
  schema: SchemaObject | Function | any; // схема данных, удовлетворяющая спецификации OAS
}
```

Применяется исключительно для конечной точки маршрута, добавляет соответствующее значение в структуру
`requestBody` соответствующего метода.

Пример использования:

```ts
//

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
  @Summary("Авторизация пользователя")
  @Description("Ожидает логин/пароль для авторизации. Возвращает токен")
  @RequestBody({ description: "Авторизационные данные", schema: AuthForm })
  @Responses({ status: 200, description: "Bearer токен для входа", schema: models.Tokens })
  @Post()
  static Login(@Body() { login, password }) {
    // ... login process
  }
}
```

Для загрузки файлов следует использовать корректный `contentType` с описанием ожидаемых полей данных.

```ts
class Files {
  @Post("/upload")
  @RequestBody({
    description: "файл для загрузки",
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
  @Summary("Загрузка файла")
  @Responses({ status: 200, description: "Информация о загруженном файле", schema: models.Files })
  static Upload(@Files("file") file: File) {
    // ...
  }
}
```

### Параметры ссылки: Parameters

Декоратор `@Parameters()` позволяет охарактеризовать параметр ссылки, который подразумевает некое
динамическое значение. Чаще всего - идентификатор записи в базе данных, или какой-то вариант значения
из ограниченного списка.

Декоратор позволяет накапливать значения, если это подразумевается логикой маршрута. Декоратор может быть
установлен на `middleware`- или на `bridge`-функцию. В этом случае он распространяется на все методы, которые
находятся в подключаемом узле.

Декоратор принимает в качестве аргумента объект следующей структуры:

```ts
interface OpenApiParameter {
  // ключ - полное значение параметра в адресной строке, включая ограничители регулярным выражением
  [parameter: string]: {
    name: string; // собственное имя параметра
    description?: string; // описание параметра
    in?: "query" | "header" | "cookie" | "path"; // местоположение аргумента: заголовок, путь, строка запроса, cookie
    required?: Boolean; // признак обязательности
    schema: SchemaObject; // схема данных параметра, удовлевторяющая критериям OAS
  };
}
```

Пример:

```ts
class Users {
  @Bridge("/user_:user_id", User)
  @Parameters({
    ":user_id": {
      name: "user_id",
      description: "Идентификатор пользователя",
      schema: { type: "number" },
    },
  })
  static User(@Next() next) {
    return next();
  }
}

class User {
  @Get()
  @Summary("Информация о пользователе")
  static Info(@Params("user_id") userId) {
    return models.Users.findById(userId);
  }

  @Delete()
  @Summary("Удалить пользователя")
  static Info(@Params("user_id") userId) {
    return models.Users.remove({ id: userId });
  }
}
```

Для всех методов в маршрутном узле `User` в документации в значении path будет заменено значение
на `/user_{user_id}`, и в список `parameters` добавлено значение

```json
{
  "name": "user_id",
  "description": "Идентификатор пользователя",
  "schema": {
    "type": "number"
  },
  "in": "path",
  "required": true
}
```

**Важно** Следует уделить особое внимание тому, как именно указывается параметр в данной структуре.
Поскольку спецификация `OpenApi` подразумевает для описания параметра в пути использовать нотацию вида
`{param}`, в то время как `koa` и другие веб-фреймворки используют для определения параметров нотацию
`:param`, подразумевающую также уточнение регулярным выражением, то в качестве значения `parameter` следует
использовать именно полное написание параметра, включая символ `:` и возможные уточнения регулярным выражением.

Поэтому, если подразумевается сложное ограничение значение параметра, например, при работе со значениями типа
`ObjectId`, характерными для базы `MongoDb` (то есть 24 символа, сочетающих латинские буквы и цифры), которое
может быть написано как `user_:user_id(.{24})`, то в качестве ключа обязано быть именно это написание. Иначе
парсер не сможет сделать замену, и в документации будет отсутствовать требуемое значение.

Для оптимизации данного процесса рекомендуется использовать следующий вариант описания параметров и их паттернов:

```ts
// используем класс User, чтобы сохранить в нем информацию о том
// какими параметрами он будет подключаться в другие узлы
@Use(User.Init)
class User {
  // имя параметра, по которому его можно получить в аргументах к методам
  static id = "user_id";
  // полное написание параметра с учетом ограничений регулярным выражением
  static toString() {
    return `:${this.id}(.{24})`;
  }
  // схема параметра, использующая оба точных значения имени и написания
  static parameterSchema() {
    return {
      [`${this}`]: {
        name: this.id,
        description: "Идентификатор пользователя",
        schema: {
          type: "string",
          pattern: "[a-z,0-9]{24}",
        },
      },
    };
  }

  @Middleware()
  @Parameters(User.parameterSchema())
  static Init(@Params(User.id) userId, @Next() next, @Err() err) {
    // ... логика инициации
  }
}

//... применение в других маршрутных узлах
@Bridge(`/user_${User}`, User) // будет получено написание параметра включая ограничения
class Users {
  // ... методы класса Users
}
```

### Параметры поисковой строки: QueryString

### Управление тегами: AddTag и UseTag

Документация средствами `aom` поддерживает группировку данных по тегам. Для создания тега необходимо для
класса - маршрутного узла - применить декоратор `@AddTag`, который принимает в качестве аргумента структуру
данных `TagObject`:

```ts
{
    name: string; // имя тега
    description?: string; // описание тега
    externalDocs?: ExternalDocumentationObject; // ссылка на внешнее описание
}
```

Для того, чтобы применить созданный тег, необходимо его добавить к `middleware`- или `endpoint`-функции,
используя декоратор `@UseTag`.

Тег, примененный к прослойке распространяется на все конечные точки маршрута, до тех пор не будет заменен
другим тегом на маршруте, либо объединен с ним, если установлены специальные правила (подробности ниже).

Пример:

```ts
@AddTag({ name: "Работа с файлами", description: "Стандартные методы работы с файлами" })
@Use(Files.Init)
class Files {
  @Get()
  @Summary("Files list")
  static Index() {
    return fs.readdirSync(__dirname);
  }

  @Middleware()
  @UseTag(Files)
  static Init(@Next() next) {
    return next();
  }
}
```

#### Приоритеты тегов и правила замены: IgnoreNextTags, ReplaceNextTags, MergeNextTags

Тег, установленный при помощи `@UseTag` на `endpoint` имеет наивысший приоритет и не может быть чем-то заменен.
В то время как теги, примененные к `middleware` хоть и распространяются на все "нижележащие" функции,
могут быть заменены, проигнорированы или объединены с тегами, которые могут появиться "дальше по списку".

Рассмотрим пример:

```ts
// ... root.ts

@Bridge("/users", Users)
@Bridge("/files", Files)
@AddTag({ name: "Основные методы" })
class Root {
  @Get("/docs.json")
  @Summary("Документация")
  static Docs() {
    return docs;
  }

  @Get("/routes")
  @Summary("Список маршрутов")
  static Routes(@Routes() routes) {
    return routes;
  }
}

// ... users.ts
@AddTag({ name: "Списки пользователей" })
@Bridge("/user_:user_id", User)
@Use(Users.Init)
class Users {
  @Summary("Список пользователей")
  @Get()
  static Index() {
    return models.Users.find();
  }

  @Summary("Добавить пользователя")
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
@AddTag({ name: "Информация о пользователе" })
@Use(User.Init)
class User {
  user: models.Users;

  @Summary("Данные пользователя")
  @Get()
  static Index(@This() { user }: User) {
    return user;
  }

  @Summary("Удалить пользователя")
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
@AddTag("Работа с файлами")
@Bridge("/file_:file_id", File)
@Use(Files.Init)
class Files {
  where = {}; // специальные критерии для отбора

  @Summary("Список файлов")
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
@AddTag("Данные файла")
@Use(File.Init)
class File {
  file: models.Files;

  @Summary("Информация о файле")
  @Get()
  static Index(@This() { file }: Files) {
    return file;
  }

  @Summary("Удалить файл")
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

По умолчанию для всех тегов работает правило по умолчанию, а именно `ReplaceNextTags`. Оно означает, что
по мере "погружения" в структуру запросов, каждый новый встречаемый тег будет заменять собой предыдуший.

Таким образом в указанном примере всех тегов сработает правило по умолчанию, и каждая группа запросов
будет правильно промаркирована тегом собственного класса, который распространится на них через
соответствующую прослойку.
То есть маркировка будет следующая

```
> Основные методы
  -- GET /docs.json
  -- GET /routes
> Списки пользователей
  - GET /users
  - POST /users
> Информация о пользователе
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Работа с файлами
  - GET /files
> Данные файла
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

Рассмотрим ситуацию, когда необходимо расширить функциональность маршрутного узла `User`, добавив в него
возможность работать с файлами, принадлежающими этому пользователю, аналогично тем же методам, которые
применяются для прочих файлов.

```ts
// ... user.ts
@AddTag({ name: "Информация о пользователе" })
@Use(User.Init)
class User {
  user: models.Users;

  @Summary("Данные пользователя")
  @Get()
  static Index(@This() { user }: User) {
    return user;
  }

  @Summary("Удалить пользователя")
  @Delete()
  static Delete(@This() { user }: User) {
    const result = await user.delete();
    return result;
  }

  // создадим мост на маршрутный узел Files
  @Bridge("/files", Files)
  static files(@Next() next, @This() { user }: User, @StateMap() stateMap) {
    // в StateMap добавим экземпляр класса Files
    // у которого будет установлены специальные критерии отбора
    // только те файлы, которые принадлежат контекстному пользователю
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

В результате данной модификации получится ситуация, что после подключения моста в тег
"Работа с файлами" (`@UseTag(Files)`) и "Информация о файле" (`@UseTag(File)`) попадут также
методы, которые входят в контекст работы с пользователем.

То есть список методов в тегах будет следующим:

```
> Основные методы
  -- GET /docs.json
  -- GET /routes
> Списки пользователей
  - GET /users
  - POST /users
> Информация о пользователе
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Работа с файлами
  - GET /files
  - GET /users/user_{user_id}/files
> Данные файла
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
```

Очевидно, что такая разбивка не совсем корректна, и ожидается, что методы работы с пользовательскими
файлами будут как-то привязаны к контексту тегов "Информация о пользователе".

Для того, чтобы модифицировать логику обработки тегов, имеются три декоратора, применяемые к
`bridge`-функциям:

- `@IgnoreNextTags()` - все теги, идущие после данного декоратора игнорируются. Для маркировки используется
  последний активный тег.
- `@MergeNextTags()` - все теги, идущие после данного декоратора объединяются с последним активным тегом.
  При этом, количество дальнейших тегов может быть больше 1, и все они будут объединены последовательно.
  Для объединения используется символ, храняшийся в свойстве `mergeSeparator` экземпляра класса `OpenApi`.
  По умолчанию равен `+`.
- `@ReplaceNextTags()` - последующий тег, а также все дальнейшие заменяют последний активный тег
  (режим работы "по умолчанию")

Таким образом, если к `bridge`-функции `User.files` применить декоратор `@IgnoreNextTags()`, то структура
принадлежности маршрутов тегам будет следующей:

```
> Основные методы
  -- GET /docs.json
  -- GET /routes
> Списки пользователей
  - GET /users
  - POST /users
> Информация о пользователе
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
  - GET /users/user_{user_id}/files
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
> Работа с файлами
  - GET /files
> Данные файла
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

Если применить декоратор `@MergeNextTags()`, то получится следующая структура:

```
> Основные методы
  -- GET /docs.json
  -- GET /routes
> Списки пользователей
  - GET /users
  - POST /users
> Информация о пользователе
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Информация о пользователе+Работа с файлами
  - GET /users/user_{user_id}/files
> Информация о пользователе+Работа с файлами+Данные файла
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
> Работа с файлами
  - GET /files
> Данные файла
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

В зависимости от предпочтений и применяемых методологий можно выбирать ту или иную стратегию
маркировки тегами.

Декораторы `IgnoreNextTags`, `MergeNextTags` и `IgnoreNextTags` работают по принципу переключателей:
то есть каждый последующий заменяет собой действие предыдущего, и после него начинают действовать
новые правила. Таким образом, можно комбинировать сочетания объединений, замены или использования
последнего активного тега.

### Протоколы безопасности: AddSecurity и UseSecurity
Для добавления информации о протоколах безопасности используются декоратор `@AddSecurity`, применяемый
к классу - маршрутному узлу, создающему слой данных, требующих выполнение данного протокола.

Декоратор `@AddSecurity` принимает в качестве аргумента объект, отвечающий структуре `SecuritySchemeObject`
из библиотеки `openapi3-ts`, и соответствующий описанию
[`Security Scheme Object`](https://swagger.io/specification/#security-scheme-object) в документации.

Для подключения созданного протокола безопасности, необходимо на `middleware`-функцию, после которой
начинают действовать указанные правила, добавить декоратор `@UseSecurity`, передав в качестве аргумента
класс, который инициирует данный протокол.

Пример:

```ts
// опишем схему, которая соответствует авторизации по bearer токену
const BearerSecuritySchema = {
  type: "http",
  in: "header",
  name: "Authorization",
  scheme: "bearer",
};

@AddSecurity(BearerSecuritySchema)
export class Auth {
  user: models.Users;
  // ...
  @Post()
  @Summary("Авторизация по логину/паролю")
  @Responses(
    { status: 200, description: "Успешная авторизация", schema: models.Token },
    { status: 500, description: "Ошибка авторизации", schema: ErrorResponse }
  )
  @RequestBody({ description: "Логин/пароль", schema: AuthForm })
  static async Login(@Body() { login, password }, @Next() next, @Err() err) {
    const authData = await models.Auth.checkAuth(login, password);
    if (models.Auth) {
      const token = await models.Token.generateToken(authData);
      return token;
    } else {
      return err("Неверные авторизационные данные");
    }
  }

  // создадим прослойку, которая требует валидный токен для дальнейших действий
  @Middleware()
  @UseSecurity(Auth) // укажем, какой протокол безопасности используется
  @Responses({ status: 403, description: "Доступ запрещен", schema: ErrorResponse })
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
      return err("Неверные авторизационные данные");
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
// все методы в маршрутном узле Account требуют авторизации
// и на них распространяется схема безопасности BearerToken, соответствующая классу Auth
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

**Важно**: в настоящее время не реализована полноценная поддержка протокола `OAuth`, подразумевающих
наличие специфических разрешений на чтение/запись/удаление.
