---
title: Extra schemas usage
sidebar_position: 7
---

<!-- # Extra schemas usage -->

## ComponentSchema

`ComponentSchema` is the only decorator that does not apply to route nodes, but to structures that
are nested documents in data models, or for common data structure, if you need to show them into section
`Schemas` of Swagger documentation.

It is recommended to use it for all models and data schemas: `aom` will create links to the
specified types like `{$ref: "#/components/schema/ClassName"}`

The use of this decorator is due to the peculiarities of the work of the `class-validator` and
`class-validator-jsonschema` packages, which require observance of certain rules when using the
decorator [`@ValidateNested`](https://github.com/epiphone/class-validator-jsonschema#validatenested-and-arrays).

```ts
// ...
// ... data model with nested structure (using `typegoose`)
class Users {
  @prop({ ref: () => Users })
  @IsMongoId()
  userId: Ref<Users>;

  @prop({ type: () => HistoryAction })
  @ValidateNested({ each: true })
  @Type(() => HistoryAction)
  history: HistoryAction[];
}

// ... subdocument `HistoryAction`
// add a decorator to it, which will create a definition that the generator `json-schema` will refer to
@ComponentSchema()
class HistoryAction extends JSONSchema {
  @prop()
  @IsString()
  action: string;

  @prop()
  @IsDate()
  actionDate: Date;
}
```

Thus, when generating documentation with using to the `Users` data model, the correct structure
will be obtained, taking data for the nested list.
