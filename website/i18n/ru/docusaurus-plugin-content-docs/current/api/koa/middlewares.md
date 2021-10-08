---
title: Соединение маршрутов
sidebar_position: 3
---

## Мосты (Bridge) и прослойки (Middleware)

Прослойки создаются при помощи декоратора `@Middleware()`. Он не принимает аргументов, и просто позволяет
использовать указанный метод как промежуточный слой к любому другому элементу маршрутного узла:
конечной точкой, мостом, другой прослойкой или маршрутным узлом целиком.

Подключение `middleware` происходит при помощи декоратора `@Use()`, принимающего в качестве аргументов
последовательность `middleware`-функций: `@Use(Root.Init, Auth.Required, Users.Init)`.
Декоратор `@Use()` может быть применен к endpoint-у, маршрутному узлу целиком, другой прослойке или мосту.
Все прослойки всегда выполняются перед элементом, к которому они применены.

Для соединения маршрутных элементов между собой используются мосты, создаваемые декоратором `@Bridge`.
Аргументами к декоратору являются:

- `prefix: string` - адресный префикс маршрута, может содержать параметр, контекстный целевому маршрутному
  элементу
- `nextRoute: Function` - следующий маршрутный узел: задекорированный класс, который может содержать другие
  мосты, прослойки и `endpoint`-ы

Декоратор `@Bridge` может применяться как к классу, так и к методу класса. В последнем случае метод класса
выступает как прослойка к подключаемому маршруту.

Пример:

```ts
// ... index.ts
import { Get, Bridge, Use, Middleware } from "aom";
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
import { Get, Bridge, Params, StateMap, Next, Err } from "aom";
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
  filename: string; // полное имя файла
  info: any; // информация о файле

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

**Важно**: при сборке все мосты подключаются после `endpoint`-ов текущего узла. Таким образом, если вдруг
возникнет коллизия в значениях `url` и/или `prefix`, то приоритет останется за методами, подключенными
последними, то есть через `@Bridge`. Разработчик обязан самостоятельно следить за адресным пространством,
которое он использует.

## Marker

Декоратор `@Marker()` позволяет обогатить информацию о точке назначения в маршрутной карте, указав,
что для элемента `route` в цепочке предшествующих ему `middleware` есть элементы `cursor` с определенными
значениями `prefix`, к который применяется какая-то особая логика.

Декоратор применяется на `middleware`-функцию, таким образом, что в момент, когда эта `middleware`
используется на любом из участков маршрутной карты, маркер применяется к конечной точке согласно правилам
функции маркировки.

Декоратор `@Marker()` принимает аргументом функцию маркировки, которая должна принимать два аргумента:
`route` и `cursor`. Курсором будет всегда прослойка, к которой применен декоратор `@Marker`

Маркировка устанавливается в процессе сбора маршрутной карты и не оперирует контекстом. Наличие маркировки
в элементе маршрута может служить основанием для дополнительных контекстных проверок: полномочий,
прав доступа и других составных операций.

Рассмотрим использование маркировки на примере контроля доступа к маршрутным точкам.

```ts
// для проверки прав доступа применяется модель данных, которая использует точечное хранение
// конечных и промежуточных участков маршрута с указанием ролей, которым данные полномочия разрешены
// пользователи могут иметь одну или несколько ролей, которые позволяют ему обращаться к разным методам
class Access {
  // прослойка, выполняющая проверку, что пользователю, авторизованному в контексте, разрешен
  // доступ к данному участку маршрута
  @Middleware()
  // укажем, что данная прослойка является маркером, использущим указанную функцию маркировки
  @Marker(Access.setMark)
  static Check(
    @StateMap(Auth) { user }: Auth, // авторизационные данные пользователя
    @Route() route, // точка назначения, из которой важно знать `path` и `method`
    @Cursor() cursor, // курсор, в котором важно знать значение `prefix`
    @Next() next,
    @Err() err
  ) {
    // если для пользователя выполняется проверка, то позволим пройти данную прослойку, ведущую к указанному адресу
    if (user.checkAccess(route, cursor)) {
      return next();
    } else {
      // иначе вернем ошибку 403
      return err("access denied", 403);
    }
  }

  // создадим имя маркера
  static markerName = "check_access";
  // функция маркировки
  static setMark(route: IRoute, cursor: ICursor) {
    const { markerName } = this;
    // если для элемента `route` нет требуемого маркера, то создадим его
    if (!route[markerName]) {
      route[markerName] = [];
    }
    // добавим текущий курсор в маркерный список для route
    route[markerName].push(cursor);
  }
}
// ... применим созданный маркер
// будем использовать список маршрутов из собранной маршрутной карты, созданной при запуске сервера
import { $aom } from "./server";

@Bridge("/users", Users)
class Root {
  @Get()
  static Index() {
    return $aom.routes;
  }

  @Get("/info")
  // применим middleware, выполняющую функцию маркировки
  // маркировка распространится на метод `Root.Secure`
  @Use(Access.Check)
  static Secure() {
    return "this route is secure";
  }
}

// применим middleware, выполняющую функцию маркировки
// маркировка распространится на все методы узла Users
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

Наличие значения `check_access` для конечных точек будет являться признаком того, что эти точки
управляются функцией контроля доступа. Таким образом маркировка "подняла наверх" информацию, которую
можно использовать для визуализации структуры запросов и использовании тех из них, к которым
следует применить релевантные маркировке процедуры.

## Циклические зависимости

`aom` подразумевает повторное применение одних классов в контексте других, что может порождать циклические
зависимости модулей. Критически важное значение это имеет в случаях применения декораторов `StateMap` и `This`,
а также `Bridge` и `Use`.

Для решения этой проблемы используется функция `FwdRef`.

Пример:

```ts
// ... users.ts
import { Query, This, Bridge, Get } from "aom";
import { User } from "./user";

@Bridge(`/user_${User.id}`, User)
class Users {
  model = getModelForClass(classes.Users); // для контекстного экземпляра создадим модель typegoose вокруг класса `classes.Users`

  @Get()
  static Index(@Query() query, @This() { model }: Users) {
    return model.find({ ...query });
  }
}

// ... user.ts
import { Query, This, Bridge, Get, FwdRef } from "aom";

// для eslint-а отключим обработку ошибки циклической зависимости
// eslint-disable-next-line import/no-cycle
import { Users } from "./users";

@Use(User.Init)
class User {
  // вместо того, чтобы объявлять для узла собственное значение модели данных
  // используем его из класса `Users`
  @Get()
  static Index(@Query() query, @This(FwdRef(() => Users)) { model }: Users) {
    return model.find({ ...query });
  }
}
```

Если использовать просто `@This(Users)`, то в аргументах к декоратору будет передано значение `undefined`,
что приведет к получению экземпляра класса `User`, и значение `model` будет недоступно.

Для других декораторов функция `FwdRef` применяется следующим образом:

- `@Use(FwdRef(()=>Node.Middleware))`
- `@Bridge('/path', FwdRef(()=>NextNode))`
- `@StateMap(FwdRef(()=>AnotherNode)`

**Важно**: настоятельно рекомендуется использовать `eslint` с **активным** правилом `import/no-cycle`,
чтобы детектировать ситуации с циклическими ссылками и правильно применять `FwdRef`
