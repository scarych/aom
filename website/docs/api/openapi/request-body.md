---
title: Request body structure
sidebar_position: 4.5
---

## RequestBody

The `@RequestBody` decorator allows you to add a description for the data structure passed in the
`post`/`put`/`patch` methods.

The decorator takes an argument that has the interface:

```ts
interface OpenApiRequestBody {
  description: string; //
  contentType?: string; // content type, default: application/json
  schema: SchemaObject | ThisRefContainer | Function | any; // OAS-specified shema object
}
```

Applies exclusively to the route endpoint.

Usage example:

```ts
// define class describing auth form fields
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
class Auth {
  @Summary("User authentication")
  @Description("Accept login/password. Returns token")
  @RequestBody({ description: "Authentication data", schema: AuthForm })
  @Responses({ status: 200, description: "Authorization bearer token", schema: models.Tokens })
  @Post()
  static Login(@Body() { login, password }) {
    // ... login process
  }
}
```

When uploading files, use the correct `contentType` describing the expected data fields.

```ts
class Files {
  @Post("/upload")
  @RequestBody({
    description: "uploading file",
    contentType: "multipart/form-data",
    schema: {
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @Summary("File upload")
  @Responses({ status: 200, description: "Uploaded file info", schema: models.Files })
  static Upload(@Files("file") file: File) {
    // ...
  }
}
```
