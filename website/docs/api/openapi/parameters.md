---
title: Path and query paratemers
sidebar_position: 3
---

## PathParameters

The `@PathParameters()` decorator allows you to describe a reference url parameter with some kind
of dynamic value. Most often it is an identifier of a database record, or some enum value.

The decorator allows you to accumulate values if it is implied by the route logic. The decorator
can be set to the `middleware`- or the `bridge`-function. In this case, it applies to all methods
that are in the pluggable node.

The decorator takes as an argument an object of the following interface:

```ts
interface OpenApiPathParameter {
  // key - the full value of the parameter in the url string, including regular expression delimiters
  [parameter: string]: {
    name: string; // parameter name
    schema: SchemaObject; // parameter data schema OAS-specified
    description?: string; // parameter description
    in?: "query" | "header" | "cookie" | "path"; // parameter location: header, path, query string, cookie; default `path`
    required?: Boolean; // required flag, default is `true`
  };
}
```

Example:

```ts
class Users {
  @Bridge("/user_:user_id", User)
  @PathParameters({
    ":user_id": {
      name: "user_id",
      description: "User identifier",
      schema: { type: "number" },
    },
  })
  static userBridge(@Next() next) {
    return next();
  }
}

class User {
  @Get()
  @Summary("User info")
  static Info(@Params("user_id") userId) {
    return models.Users.findById(userId);
  }

  @Delete()
  @Summary("Delete user")
  static Info(@Params("user_id") userId) {
    return models.Users.remove({ id: userId });
  }
}
```

For all methods in the route node `User` in the documentation will be modified `url` value:
the fragment `/user_:user_id` will be replaced with `/user_{user_id}`; and to the list of `parameters`
will be added next value:

```json
{
  "name": "user_id",
  "description": "User identifier",
  "schema": {
    "type": "number"
  },
  "in": "path",
  "required": true
}
```

**Important** You should pay special attention to how the parameter is specified in the key
of this structure.

Since the `OpenApi` specification obliges to use the notation like `{param}` to describe
the parameter in the path, while `koa` and other web frameworks use the `:param` notation to
define parameters, which also implies a possible refinement with a regular expression,
then exactly the full spelling of the parameter should be used as the key value (`[parameter:string]`),
including the symbol `:` and possible regexp rules.

Therefore, if a complex restriction is implied, the parameter value, for example, when you works with
values of the `ObjectId` type specific to the `MongoDb` database (that is, 24 characters combining
Latin letters and numbers), which can be safe written as `user_:user_id(.{24})`, then this spelling
must be the key. Otherwise, the parser will not be able to make the replacement, and the required
value will be missing in the documentation.

To optimize this process, it is recommended to use the following description of parameters and
their patterns:

```ts
// use the User class to store information about what parameters it will connect to other nodes
@Use(User.Init)
class User {
  // the name of the parameter by which it can be obtained in the arguments to the methods
  static id = "user_id";
  // full spelling of the parameter, using restrictions by regular expression
  static toString() {
    return `:${this.id}(.{24})`;
  }
  // parameter schema using both the exact meanings of name and spelling
  static parameterSchema() {
    return {
      [`${this}`]: {
        name: this.id,
        description: "User identifier",
        schema: {
          type: "string",
          pattern: "[a-z,0-9]{24}",
        },
      },
    };
  }

  @Middleware()
  @PathParameters(User.parameterSchema())
  // use the parameter name into argument decorator
  static Init(@Params(User.id) userId, @Next() next, @Err() err) {
    // ... some middleware logic
  }
}

//... usage in other route nodes
@Bridge(`/user_${User}`, User) // will be received the spelling of the parameter including restrictions on the number of characters
class Users {
  // ... some class methods
}
```

## Parameters

To add to the documentation information about parameters that can be passed in the query string,
headers and cookies, you need to use the `@Parameters` decorator.

It takes as arguments a sequence of values of interface:

```ts
interface OpenApiParameter {
  name: string; // parameter name
  in: "query" | "header" | "cookie" | "path"; // parameter location: header, path, query string, cookie
  schema: SchemaObject; // parameter data schema OAS-specified
  description?: string; // parameter description
  required?: Boolean; // flag of parameter required, default: false
}
```

`@Parameters` decorator applies exclusively to the route endpoint.

Example:

```ts
class Brands {
  @Summary("Brands catalog")
  @Responses({ status: 200, isArray: true, schema: models.Brands })
  // allows to use search by fields
  @Parameters(
    // `title` (string)
    { name: "title", in: "query", schema: { type: "string" } },
    // `enabled` (enum)
    { name: "enabled", in: "query", schema: { type: "string", enum: ["yes", "no"] } }
  )
  @Get()
  static Index(@Query() query) {
    return models.Brands.find({ ...query });
  }
}
```
