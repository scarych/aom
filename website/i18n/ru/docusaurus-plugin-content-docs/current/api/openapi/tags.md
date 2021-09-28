---
title: Управление тегами
sidebar_position: 5
---

## AddTag

Документация средствами `aom` поддерживает группировку данных по тегам. Для создания тега необходимо для
класса - маршрутного узла - применить декоратор `@AddTag`, который принимает в качестве аргумента структуру
данных `TagObject`:

```ts
interface TagObject {
  name: string; // имя тега
  description?: string; // описание тега
  externalDocs?: ExternalDocumentationObject; // ссылка на внешнее описание
}
```

## UseTag

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
  @Summary("Список файлов")
  static Index() {
    return fs.readdirSync(__dirname);
  }

  @Post()
  @Summary("Загрузка файла")
  static Upload(@Files("file") file: File) {
    const filename = path.join(__dirname, file.name);
    fs.renameSync(file.path, filename);
    return filename;
  }

  @Middleware()
  @UseTag(Files)
  static Init(@Next() next) {
    return next();
  }
}
```

Все методы в узле `Files` будут отмечены тегом `Работа с файлами`.

## Приоритеты тегов и правила замены: IgnoreNextTags, ReplaceNextTags, MergeNextTags

Тег, установленный при помощи `@UseTag` на `endpoint` имеет наивысший приоритет и не может быть
чем-то заменен. В то же время теги, примененные к `middleware` хоть и распространяются на все
"нижележащие" функции, могут быть заменены, проигнорированы или объединены с тегами, которые
могут появиться "дальше по списку".

Рассмотрим пример:

```ts
// ... root.ts
import { $aom } from "./server";

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
  static Routes() {
    return $aom.routes;
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
по мере "погружения" в цепочку функций, каждый новый встречаемый тег будет заменять собой предыдуший.

Таким образом в указанном примере для всех тегов сработает правило по умолчанию, и каждая группа
запросов будет правильно промаркирована тегом собственного класса, который распространится
на них через соответствующую прослойку.

То есть маркировка `endpoint`-ов тегами будет следующая:

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

В результате данной модификации возникнет ситуация, что после подключения моста в тег
"Работа с файлами" (`@UseTag(Files)`) и "Информация о файле" (`@UseTag(File)`) попадут также
методы, которые входят в контекст работы с пользователем.

То есть список методов в тегах станет следующим:

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
файлами будут как-то привязаны к контексту тега "Информация о пользователе".

Для того, чтобы модифицировать логику обработки тегов, имеются три декоратора, применяемые к
`middleware`- или `bridge`-функциям:

- `@IgnoreNextTags()` - все теги, идущие после данного декоратора игнорируются. Для маркировки используется
  последний активный тег.
- `@MergeNextTags()` - все теги, идущие после данного декоратора объединяются с последним активным тегом.
  При этом, количество дальнейших тегов может быть больше 1, и все они будут объединены последовательно.
  Для объединения используется символ, храняшийся в свойстве `mergeSeparator` экземпляра класса `OpenApi`.
  По умолчанию равен `+`.
- `@ReplaceNextTags()` - последующий тег, а также все дальнейшие заменяют последний активный тег
  (режим работы "по умолчанию")

Применим декоратор `@IgnoreNextTags()` к `bridge`-функции в `User.files`:

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

Структура принадлежности маршрутов тегам станет следующей:

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

Декораторы `@IgnoreNextTags()`, `@MergeNextTags()` и `@IgnoreNextTags()` работают по принципу
переключателей: то есть каждый последующий заменяет собой действие предыдущего, и после него
начинают действовать новые правила. Таким образом, можно комбинировать сочетания объединений,
замены или использования последнего активного тега.
