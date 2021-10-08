---
title: Поддержка OpenAPI
sidebar_position: 0
---

## aom/openapi

Декораторы коллекции `aom/openapi` позволяют обогащать маршрутные узлы информацией, которая при сборке
формирует документацию в формате [`OAS3`](https://swagger.io/specification/), обеспечивая таким образом
естественную автодокументацию кода.

При генерации документации используется тот же принцип последовательной обработки участков маршрутных
узлов - прослоек, мостов - с накоплением релевантной информации и применением полученной совокупности
к конечной точке маршрута.

Таким образом, что если одна из прослоек при проверке данных генерирует специальную ошибку `403`, то при
ее описании для этой middleware она распространится на информацию в структуре `responses` на все
множество использующих эту прослойку endpoint-ов. Аналогичное поведение будет при генерации информации
о параметрах адресной строки, протоколах безопасности и тегах.

**Важно**: далее в этой документации будет упоминаться тип данных `SchemaObject`. В данном случае
это означает применение интерфейса из библиотеки `openapi3-ts`, означающий типовую конфигурацию
схемы данных объекта в спецификации `openapi`.

```ts
import { SchemaObject } from "openapi3-ts";
```

## Методология формирования окружения

В своей основе `aom` стремится к сокращению количества используемого кода и минимизации дубликатов структур
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

Таким образом, когда будет использовано прямое обращение к классу `Files`, то при генерации JSON будет
вызван унаследованный им метод `static toJSON()`, который вернет корректное для спецификации `OAS3`
значение с описанием структуры данных.

Тот же принцип следует использовать и для частных случаев структур данных, которые могут использоваться
в ходе разработки: входящие значения или специфические ответы.

```ts
// пример для описания данных, характеризущих авторизацию пользователя
class JSONSchema {
  static toJSON(): SchemaObject {
    return targetConstructorToSchema(this);
  }
}

class AuthForm extends JSONSchema {
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

Также, вместо использования структур, генерирующих схему данных при помощи метода `toJSON`, можно
использовать объект с существующей схемой данных, в том числе содержащий ссылки на другие значения
в документации. В этом случае необходимо будет вручную контролировать целостность таких связей,
что может осложнить разработку.

## Как это работает

Декораторы из `aom/openapi` описывают общие характеристики, которые будут включены в документацию.
Для получения конечной структуры следует использовать сборщик `aom/koa/$`, в который необходимо передать
экземпляр класса `OpenApi`, с инициированной контекстной данному api-сервису информацией.

Затем данный класс, обогащенный в процессе декомпозиции маршрутных узлов релевантными данными, можно
вернуть в одном из методов инициированного API, либо передать в библиотеку типа `swagger-ui`
в качестве источника JSON-данных.

Пример:

```ts
// ... openapi.ts
import { OpenApi } from "aom";
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

Для применения данных из декораторов к файлу документации необходимо в сборщике вызвать метод `docs`,
передав в него инициированный экземпляр класса с документацией.

```ts
// ... server.ts
import koa from "koa";
import koaRouter from "koa-router";
import { $ } from "aom";
import Docs from "./openapi";
import Root from "./root";

const app = new koa();
const router = new koaRouter();

const $aom = new $(Root)
  // соберем маршруты
  .eachRoute(({ method, path, middlewares }) => {
    router[method](path, ...middlewares);
  })
  // подключим документацию
  .docs(Docs);

app.use(router.routes()).use(router.allowedMethods());
app.listen(3000);
```

