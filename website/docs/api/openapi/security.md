---
title: Security protocols
sidebar_position: 6
---

## AddSecurity and UseSecurity

To add information about the security protocols used decorator `@AddSecurity()`, applied
to a class - of routing node, create a data layer, requiring the implementation of this Protocol.

The `@AddSecurity()` decorator takes as an argument an object that matches the `SecuritySchemeObject`
structure from the `openapi3-ts` library and matches the description for OAS documentation for
[`Security Scheme Object`](https://swagger.io/specification/#security-scheme-object).

To connect the created security protocol, it is necessary to add the `@UseSecurity()` decorator
to the `middleware`-function, after which the specified rules take effect, passing the class that
initiates this protocol as an argument.

Example:

```ts
// describe a schema that corresponds to the authorization of bearer token
const BearerSecuritySchema = {
  type: "http",
  in: "header",
  name: "Authorization",
  scheme: "bearer",
};

// define that the protocol "bearer" is the class `Auth`
@AddSecurity(BearerSecuritySchema)
export class Auth {
  user: models.Users;
  // ...
  @Post()
  @Summary("Login/password authentication")
  @Responses(
    { status: 200, description: "Success authentication", schema: models.Token },
    { status: 500, description: "Authentication error", schema: ErrorResponse }
  )
  @RequestBody({ description: "Login/password", schema: AuthForm })
  static async Login(@Body() { login, password }, @Next() next, @Err() err) {
    const authData = await models.Auth.checkAuth(login, password);
    if (models.Auth) {
      const token = await models.Token.generateToken(authData);
      return token;
    } else {
      return err("Wrong authentication data");
    }
  }

  // create a layer that requires a valid token for further actions
  @Middleware()
  @UseSecurity(Auth) // specify which security protocol is used
  @Responses({ status: 403, description: "Access denied", schema: ErrorResponse })
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
      return err("Wrong token");
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
// all methods in the route node `Account` require authorization
// and they are used the BearerToken security scheme related to the `Auth` class
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

**Important**: Currently, there is no full support for the `OAuth` protocol, which implies
the presence of specific read/write/delete permissions.
