---
title: Endpoints descriptions
sidebar_position: 1
---


## Summary and Description

The decorators `@Summary()` and `@Description()` are used to describe the endpoint of the route.
Each of them takes a string value as an argument.

```ts
import { Summary, Description } from "aom";
import { Get, Post } from "aom";

class Users {
  @Summary("Users list")
  @Description("Return the list of active users")
  @Get()
  static List() {
    return models.Users.find({ active: true });
  }

  @Summary("Add new user")
  @Description("Create new user and return user info")
  @Post()
  static Add(@Body() body) {
    return models.Users.create({ ...body });
  }
}
```

The description of the method is not cumulative information, and is used purposefully for each
endpoint of the route.

