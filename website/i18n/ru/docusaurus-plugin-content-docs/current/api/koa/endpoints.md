---
title: Конечные точки
sidebar_position: 2
---

## Конечные точки маршрутов

Все `endpoint`-ы создаются при помощи декораторов из следующего списка:

- `@Endpoint(method = 'get'|'post'|'put'|'patch'|'delete'|'options'|'all', path )` - указывает,
  что создается `endpoint`, указывающий на адрес `path`, и доступный через метод `method`. Чтобы создать
  endpoint через данный декоратор, необходимо указать как минимум используемый метод. Вызов данного
  декоратора без аргументов создает общий endpoint (подробнее ниже). По умолчанию значение `path='/'`.
- `@Get(path)` - сокращение для `@Endpoint('get', path)`
- `@Post(path)` - сокращение для `@Endpoint('post', path)`
- `@Put(path)` - сокращение для `@Endpoint('put', path)`
- `@Patch(path)` - сокращение для `@Endpoint('patch', path)`
- `@Delete(path)` - сокращение для `@Endpoint('delete', path)`
- `@Options(path)` - сокращение для `@Endpoint('options', path)`
- `@All(path)` - сокращение для `@Endpoint('all', path)`

Все декораторы сокращений применяются над статичными методами класса без второго аргумента. Использование
второго агумента применяется только для общих точек назначения (описано ниже), и используются как
декораторы класса.

Значение `path` может иметь несколько уровней вложенности, и даже содержать типовой `koa-router`-параметр.
В качестве значения ссылки используется фрагмент адреса, который характеризует данный метод исключительно
в пределах данного маршрутного узла. Полное имя адреса будет построено на основании всех связей,
которые предшествовали данному `endpoint`-у.

Указанные декораторы следующим образом:

```ts
// ... index.ts
import { Get, Post, Body, Params } from "aom";

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
`GET /choose/:variant`, который, после подключения в маршрутную карту, предоставит к ним доступ
с учетом возможных префиксов.

## Общие endpoint-ы

`aom` позволяет создать общие точки назначения, позволяя использовать повторно один и тот же
код в разных местах по разному адресу доступа и, если необходимо, по разному методу.

Для объявления метода класса общей точкой назначения, используется декоратор `@Endpoint()` без
аргументов. После чего данный метод может быть использован в качестве второго аргумента для декораторов
сокращений, примененных к классу, в котором требуется использовать данные методы.

Пример:

```ts
// создадим два общих endpoint-а, которые используют значение модели данных из контекстного состояния
class Data {
  @Endpoint()
  static List(@State() { model }, @Query() query) {
    return model.find({ ...query });
  }

  @Endpoint()
  static Add(@State() { model }, @Body() body) {
    return model.create({ ...body });
  }
}

// создадим маршрутный узел, в котором при инициации будет объявлена модель данных `Users`
// и подключим в нее ранее объявленные точки назначения по указанному пути и методам
@Use(Users.Init)
@Get("/", Data.List)
@Post("/", Data.Add)
class Users {
  model = models.Users;

  @Middleware()
  static Init(@State() state, @This() { model }: Users, @Next() next) {
    Object.assign(state, { model });
    return next();
  }
}

// создадим маршрутный узел, в котором при инициации будет объявлена модель данных `Customers`
// и подключим в нее ранее объявленные точки назначения по указанному пути и методам
@Use(Customers.Init)
@Get("/", Data.List)
@Post("/", Data.Add)
class Customers {
  model = models.Customers;

  @Middleware()
  static Init(@State() state, @This() { model }: Users, @Next() next) {
    Object.assign(state, { model });
    return next();
  }
}
```

В качестве второго аргумента для декораторов `Get`/`Post`/`Put`/`Patch`/`Options`/`Delete`/`All` могут
использоваться только те методы, которые были инициированы как "общие" декораторы. В противном случае
при сборке будет вызвана ошибка.

**Важно!** Контекстом "общих" точек назначения является класс, в котором они объявлены: то есть в
декораторе `@This` по умолчанию будет использован собственный класс (в указанном примере `Data`),
а в возвращаемом значении декоратора `@Route()` при разных вызовах будет отличаться только
значения `path` и `method`.

## Составные точки назначения: `@UseNext`

Конечные точки маршрута могут быть сформированы из составных элементов. Например при реализации механизмов,
подразумевающих разные условия входа в конечную точку и одинаковые структуры данных на выходе.

Для создания составной точки назначения используется декоратор `@UseNext`, аргументом которого является
указатель на общий endpoint, который будет вызван, если было возвращено значение `next()`.

Пример:

```ts
class Auth {
  login: AuthLogins;

  @Post("/login")
  @Summary("Авторизация по логину")
  @RequestBody({
    schema: LoginForm,
  })
  @Requests({
    status: 400,
    schema: ErrorResponse,
  })
  @UseNext(Auth.GenerateTokens) // определим следующим элементов в цепочке метод `Auth.GenerateTokens`
  static async Login(
    @SafeBody(LoginForm) { login, password }: LoginForm,
    @This() auth: Auth,
    @Err() err,
    @Next() next
  ) {
    // найдем логин с типом "произвольный логин"
    auth.login = await AuthLogins.findOne({ login, type: "custom" });
    // вернем ошибку если логин не найден
    if (!auth.login) {
      return err("login not found", 400);
    }
    // вернем ошибку, если неправильный пароль
    if (auth.login.checkPassword(password)) {
      return err("wrong password", 400);
    }
    // иначе перейдем на следующую функцию - генерацию токена для авторизации
    return next();
  }

  // создадим прослойку для проверки
  @Middleware()
  @Responses({
    status: 400,
    schema: ErrorResponse,
  })
  static async CheckPhoneNumber(@This() auth: Auth, @Body() { login }, @Err() err, @Next() next) {
    // найдем логин с типом "номер телефона"
    auth.login = await AuthLogins.findOne({ login, type: "phone" });
    if (!auth.login) {
      return err("login not found", 400);
    }
    return next();
  }

  @Post("/request-code")
  @Summary("Запросить авторизацию по номеру телефона")
  @RequestBody({
    schema: RequestCodeForm,
  })
  @Responses({
    status: 200,
    schema: MessageResponse,
  })
  @Use(Auth.CheckPhoneNumber) // предварительно проверим, что такой логин существует
  static async RequestCode(@This() { login }: Auth) {
    await login.sendOneOffCode(); // сгенерируем и отправим одноразовый код
    return { message: "Код отправлен по смс" };
  }

  @Post("/confirm-code")
  @Summary("Подтвердить авторизацию по номеру телефона")
  @RequestBody({
    schema: ConfirmCodeForm,
  })
  @Requests({
    status: 400,
    schema: ErrorResponse,
  })
  @Use(Auth.CheckPhoneNumber) // предварительно проверим, что логин валиден и существует
  @UseNext(Auth.GenerateTokens) // определим следующим элементов в цепочке метод `Auth.GenerateTokens`
  static ConfirmCode(
    @SafeBody(ConfirmCodeForm) { code }: ConfirmCodeForm,
    @This() { login }: Auth,
    @Err() err,
    @Next() next
  ) {
    // проверим, что указанный одноразовый код валиден
    const codeIsValid = await login.checkOneOffCode(code);
    // если это не так, то вернем ошибку
    if (!codeIsValid) {
      return err("wrong code", 400);
    }
    // иначе перейдем на следующую функцию - генерацию токена для авторизации
    return next();
  }

  // создадим общую конечную точку
  @Endpoint()
  // опишем возвращемый в ней тип данных
  @Responses({
    status: 200,
    schema: AuthTokens,
  })
  // поскольку она вызывается после прохождения всех прочих проверок, все данные в ней безопасны
  // и могут быть использованы непосредственно в момент вызова
  static GenerateTokens(@This() { login }: Auth) {
    const { _id: loginId } = login;
    const newToken = new AuthTokens({ loginId });
    const lifetime = 60 * 60 * 1000; //
    await newToken.generateRandomData(lifetime);
    return newToken;
  }
}
```

Длина составного маршрута может быть произвольной длины. В этом случае для каждой общей конечной точки
следует добавлять декоратор `@UseNext` с указанием следующей вызываемой функции, и возвращать в ней
значение `next()` в случае успешного прохождения ее логики.

Если составной фрагмент маршрута использует `middleware`, то они будут добавлены в общую последовательность
вызовов.