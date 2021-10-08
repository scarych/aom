---
title: Endpoints decorators
sidebar_position: 2
---

## The routes endpoints

All endpoints are created using decorators from the following list:

- `@Endpoint(method = 'get'|'post'|'put'|'patch'|'delete'|'options'|'all', path)` - creates
  `endpoint`, pointing to the address `path` on the `method` method. To create an endpoint via
  this decorator, you must specify at least the method to be used. Calling this decorator
  without arguments creates a common endpoint (more details below). Default: `path='/'`.
- `@Get(path)` - shortcut for `@Endpoint(path, 'get')`
- `@Post(path)` - shortcut for `@Endpoint(path, 'post')`
- `@Put(path)` - shortcut for `@Endpoint(path, 'put')`
- `@Patch(path)` - shortcut for `@Endpoint(path, 'patch')`
- `@Delete(path)` - shortcut for `@Endpoint(path, 'delete')`
- `@Options(path)` - shortcut for `@Endpoint(path, 'options')`
- `@All(path)` - shortcut for `@Endpoint(path, 'all')`

All shortcuts decorators are applied over static class methods without a second argument.
The use of the second argument applies only to common endpoints (described below), and
is used as class decorators.

The `path` value can have several levels of nesting, and even contain a typical `koa-router` parameter.
As the value of the link, a fragment of the address is used, which characterizes this method exclusively
within the given route node. The full name of the address will be built based on all links,
which preceded the given `endpoint`.

The specified decorators are applied as follows:

```ts
// ... index.ts
import { Get, Post, Body } from "aom";

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

This will create a route node with methods: `GET /`, `POST /save` and `GET /choose/:variant`,
which, after connecting to the route map, will provide access to them using the declared prefixes.

## Common endpoints

`aom` allows you to create common endpoints, allowing you to reuse the same code in different
places at a different access address and, if necessary, in a different method.

To declare a class method as a common endpoint, use the `@Endpoint()` decorator with no arguments.
Then this method can be used as the second argument for the shortcut decorators applied to the
class in which you want to use these methods.

Example:

```ts
// let's create two common endpoints that use the value of the data model from the context state
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

// create a route node in which the `Users` data model will be declared upon initiation
// and connect the previously declared destination points to it by the specified path and methods
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

// create a route node in which the `Customers` data model will be declared upon initiation
// and connect the previously declared destination points to it by the specified path and methods
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

Only methods that were invoked as "common" decorators can be used as the second argument for
the `Get`/`Post`/`Put`/`Patch`/ `Options`/`Delete`/`All` decorators. Otherwise, the build will
throw an error.

**Important!** The context of "common" endpoints is the class in which they are declared: that is,
the default `@This` decorator will use its own class (in the example, `Data`), and the
return value of the `@Route()` with different calls will differ only in the values of `path` and `method`.

## Composite endpoints: `@UseNext`

Route endpoints can be formed from building blocks. For example, when implementing mechanisms
that imply different conditions for entering the endpoint and the same data structures at the output.

To create a composite destination, the `@UseNext` decorator is used, the argument of which is a
pointer to the general endpoint, which will be called if `next()` was returned.

Example:

```ts
class Auth {
  login: AuthLogins;

  @Post("/login")
  @Summary("Login/password authentication")
  @RequestBody({
    schema: LoginForm,
  })
  @Requests({
    status: 400,
    schema: ErrorResponse,
  })
  @UseNext(Auth.GenerateTokens) // define the next elements in the chain `Auth.GenerateTokens` method
  static async Login(
    @SafeBody(LoginForm) { login, password }: LoginForm,
    @This() auth: Auth,
    @Err() err,
    @Next() next
  ) {
    // find a login with the "custom" type
    auth.login = await AuthLogins.findOne({ login, type: "custom" });
    // return an error if the login is not found
    if (!auth.login) {
      return err("login not found", 400);
    }
    // return an error if the password is incorrect
    if (auth.login.checkPassword(password)) {
      return err("wrong password", 400);
    }
    // otherwise, go to the next function - generating a token for authorization
    return next();
  }

  // create a middleware for checking
  @Middleware()
  @Responses({
    status: 400,
    schema: ErrorResponse,
  })
  static async CheckPhoneNumber(@This() auth: Auth, @Body() { login }, @Err() err, @Next() next) {
    // find a login with the type "phone"
    auth.login = await AuthLogins.findOne({ login, type: "phone" });
    // return error response if login not found
    if (!auth.login) {
      return err("login not found", 400);
    }
    return next();
  }

  @Post("/request-code")
  @Summary("Request authorization by phone number")
  @RequestBody({
    schema: RequestCodeForm,
  })
  @Responses({
    status: 200,
    schema: MessageResponse,
  })
  @Use(Auth.CheckPhoneNumber) // first check that such a login exists
  static async RequestCode(@This() { login }: Auth) {
    await login.sendOneOffCode(); // generate and send a one-off code
    return { message: "Code sent by SMS" };
  }

  @Post("/confirm-code")
  @Summary("Confirm authorization by phone number")
  @RequestBody({
    schema: ConfirmCodeForm,
  })
  @Requests({
    status: 400,
    schema: ErrorResponse,
  })
  @Use(Auth.CheckPhoneNumber) // first check that such a login exists
  @UseNext(Auth.GenerateTokens) // define the next elements in the chain `Auth.GenerateTokens` method
  static ConfirmCode(
    @SafeBody(ConfirmCodeForm) { code }: ConfirmCodeForm,
    @This() { login }: Auth,
    @Err() err,
    @Next() next
  ) {
    // check that the specified one-off code is valid
    const codeIsValid = await login.checkOneOffCode(code);
    // return the error if code not valid
    if (!codeIsValid) {
      return err("wrong code", 400);
    }
    // otherwise, go to the next function - generating a token for authorization
    return next();
  }

  // create common endpoint
  @Endpoint()
  // describe returned data schema
  @Responses({
    status: 200,
    schema: AuthTokens,
  })
  // since it is called after all other checks have passed, all data in it is safe
  // and can be used directly at the time of the call
  static GenerateTokens(@This() { login }: Auth) {
    const { _id: loginId } = login;
    const newToken = new AuthTokens({ loginId });
    const lifetime = 60 * 60 * 1000; //
    await newToken.generateRandomData(lifetime);
    return newToken;
  }
}
```

The length of a compound route can be of any length. In this case, for each common endpoint, add
the `@UseNext` decorator specifying the next function to be called, and return the `next()` value
in it if its logic is successful.

If a composite route fragment uses `middleware`, then they will be added to the cursors call sequence.
