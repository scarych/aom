---
title: OpenAPI support
sidebar_position: 0
---

# aom/openapi

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

## Environment formation methodology

At its core, `aom` aims to reduce the amount of code used and minimize duplicate data structures.
The same principles are used in order to make the most of the possibilities of the `JavaScript`
language and to enrich the used data structures with an environment that will allow generating
the necessary code on demand.

Decorators from `aom/openapi` are used exclusively for route nodes, but they accept data model
references as their arguments. The documentation file is generated when the `toJSON` method
is called, so you need to take care that such data structures have the ability to return a
valid structure describing it with the `JSON-schema` standard using their own `toJSON` methods
(for classes or objects)

It is good practice to use decorators from the libraries [`class-validator`](https://www.npmjs.com/package/class-validator)
and [`class-validator-jsonschema`](https://www.npmjs.com/package/class-validator-jsonschema).

For example, in combination with the using the `typeorm` or `typegoose` methodology, this allows you
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

Thus, when the `Files` class will be used for generating JSON, the inherited method `static toJSON()`
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

## How does this works

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
import { OpenApi } from "aom";
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
import { $ } from "aom";
import Docs from "./openapi";
import Root from "./root";

const app = new koa();
const router = new koaRouter();

new $(Root)
  // assemble the routes
  .eachRoute(({ method, path, middlewares }) => {
    router[method](path, ...middlewares);
  })
  // attach documentation
  .docs(Docs);

app.use(router.routes()).use(router.allowedMethods());
app.listen(3000);
```
