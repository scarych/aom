---
title: Tags usage
sidebar_position: 5
---

## AddTag

The aom documentation supports grouping data by tags. To create a tag, it is necessary for the
class - route node - to apply the `@AddTag` decorator, which takes the `TagObject` data structure
as an argument:

```ts
interface TagObject {
  name: string; // tag name
  description?: string; // tag description
  externalDocs?: ExternalDocumentationObject; // external document object (https://swagger.io/specification/#external-documentation-object)
}
```

## UseTag

In order to apply the created tag, you need to add it to the `middleware` or `endpoint` function
using the `@UseTag` decorator.

The tag applied to the middleware applies to all endpoints of the route, until it is replaced
by another tag on the route, or merged with it, if special rules are set (details below).

Example:

```ts
@AddTag({ name: "File processing", description: "Standart methods for files" })
@Use(Files.Init)
class Files {
  @Get()
  @Summary("Files list")
  static Index() {
    return fs.readdirSync(__dirname);
  }

  @Post()
  @Summary("File upload")
  static Upload(@Files("file") file: File) {
    const filename = path.join(__dirname, file.name);
    fs.renameSync(file.path, filename);
    return filename;
  }

  @Middleware()
  @UseTag(Files) //
  static Init(@Next() next) {
    return next();
  }
}
```

All methods in the `Files` route node will be tagged with the `File processing`.

## Tagging priority: IgnoreNextTags, ReplaceNextTags, MergeNextTags

A tag set with `@UseTag` to `endpoint` has the highest priority and cannot be overridden.
At the same time, tags applied to `middleware`, although they apply to all "underlying "functions,
can be replaced, ignored or combined with tags that may appear "further down the list".

Let's consider an example:

```ts
// ... root.ts
import { $aom } from "./server";

@Bridge("/users", Users)
@Bridge("/files", Files)
@AddTag({ name: "Basic methods" })
class Root {
  @Get("/docs.json")
  @Summary("Documentation")
  static Docs() {
    return docs;
  }

  @Get("/routes")
  @Summary("Routes list")
  static Routes() {
    return $aom.routes;
  }
}

// ... users.ts
@AddTag({ name: "Users list processing" })
@Bridge("/user_:user_id", User)
@Use(Users.Init)
class Users {
  @Summary("Users list")
  @Get()
  static Index() {
    return models.Users.find();
  }

  @Summary("Add new user")
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
@AddTag({ name: "Single user processing" })
@Use(User.Init)
class User {
  user: models.Users;

  @Summary("User info")
  @Get()
  static Index(@This() { user }: User) {
    return user;
  }

  @Summary("Delete user")
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
@AddTag("Files list processing")
@Bridge("/file_:file_id", File)
@Use(Files.Init)
class Files {
  where = {}; // files search criterias

  @Summary("Files list")
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
@AddTag("Single file processing")
@Use(File.Init)
class File {
  file: models.Files;

  @Summary("File info")
  @Get()
  static Index(@This() { file }: Files) {
    return file;
  }

  @Summary("Delete file")
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

By default, for all tags will be applied rule `ReplaceNextTags`. It means that as you "deep" into
the chain of functions, each new tag encountered will replace the previous one.

Thus, in the above example, the default rule will work for all tags, and each group of requests
will be correctly marked with a tag of its own class, which will be propagated to them through
the initiated middleware.

That is, the tagging of `endpoints` will be as follows:

```
> Basic methods
  -- GET /docs.json
  -- GET /routes
> Users list processing
  - GET /users
  - POST /users
> Single user processing
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Files list processing
  - GET /files
> Single file processing
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

Let's consider a situation when it is necessary to extend the functionality of the `User`
route node by adding the ability to work with files belonging to this user, in the same methods
as for other files.

```ts
// ... user.ts
@AddTag({ name: "Single user processing" })
@Use(User.Init)
class User {
  user: models.Users;

  @Summary("User info")
  @Get()
  static Index(@This() { user }: User) {
    return user;
  }

  @Summary("Delete user")
  @Delete()
  static Delete(@This() { user }: User) {
    const result = await user.delete();
    return result;
  }

  // create a bridge to the `Files` route node
  @Bridge("/files", Files)
  static files(@Next() next, @This() { user }: User, @StateMap() stateMap) {
    // add an instance of the Files class to StateMap,
    // which will have special search criteria set only for those files that belong to the context user
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

As a result of this modification a situation arises that after connecting the bridge to
the tag "Files list processing" ( `@UseTag(Files)`) and the "Single file processing"
(`@UseTag(File)`) will fall as the methods that are provided in the context of work with the user.

That is, the list of methods in tags will become as follows:

```
> Basic methods
  -- GET /docs.json
  -- GET /routes
> Users list processing
  - GET /users
  - POST /users
> Single user processing
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Files list processing
  - GET /files
  - GET /users/user_{user_id}/files
> Single file processing
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
```

Obviously, this tagging is not entirely correct, and it is expected that the methods
of working with user files will be somehow tied to the context of the "Single user processing" tag.

To modify the tag processing logic, there are three decorators applied to the
`middleware`- or `bridge`-functions:

- `@IgnoreNextTags()` - all tags following this decorator are ignored. The last active tag is
  used for marking.
- `@MergeNextTags()` - all tags following this decorator are merged with the last active tag.
  In this case, the number of further tags can be more than 1, and all of them will be combined
  sequentially. For merging, the symbol stored in the `mergeSeparator` property of an instance
  of the` OpenApi` class is used. The default is `+`.
- `@ReplaceNextTags()` - the subsequent tag as well as all further ones replace the last
  active tag ("default" mode )

Apply the decorator `@IgnoreNextTags()` to the `bridge`-function into `User.files`:

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

Then the structure of the routes belonging to tags will be as follows:

```
> Basic methods
  -- GET /docs.json
  -- GET /routes
> Users list processing
  - GET /users
  - POST /users
> Single user processing
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
  - GET /users/user_{user_id}/files
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
> Files list processing
  - GET /files
> Single file processing
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

If we use the `@MergeNextTags()` decorator, we get the following structure:

```
> Basic methods
  -- GET /docs.json
  -- GET /routes
> Users list processing
  - GET /users
  - POST /users
> Single user processing
  - GET /users/user_{user_id}
  - DELETE /users/user_{user_id}
> Single user processing+Files list processing
  - GET /users/user_{user_id}/files
> Single user processing+Files list processing+Single file processing
  - GET /users/user_{user_id}/files/file_{file_id}
  - DELETE /users/user_{user_id}/files/file_{file_id}
> Files list processing
  - GET /files
> Single file processing
  - GET /files/file_{file_id}
  - DELETE /files/file_{file_id}
```

Depending on preference and applied methodologies, you can choose one or another tagging strategy.

The decorators `@IgnoreNextTags()`, `@MergeNextTags()` and `@IgnoreNextTags()` work on the principle
of switches: that is, each subsequent one replaces the action of the previous one, and new rules
take effect after it. Thus, you can combine combinations of merging, replacements, or the use of
the last active tag.
