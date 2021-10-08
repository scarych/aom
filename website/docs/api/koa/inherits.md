---
title: Routes inheritance
sidebar_position: 5
---

## Inheritance logic

`aom` supports the mechanics of data inheritance, which allows you to create generic route nodes,
the logic of which extends to common cases.

Inheritance is done in a standard JavaScript way: using the `extends` operator.

When inheriting for a child class, it is necessary to use the `@Controller` class decorator,
since it is in it that the actions for the correct transfer of routes, endpoints, middleware
and used arguments are performed.

If the child class has its own static methods that overload the values of the parent class, then
they will remain unchanged. Similarly, if `endpoints` or `bridge` constructions with addresses
and methods similar to the parent ones exist in the child class, then they will not be affected
by inheritance. In that case, when assembling the route map, notifications will be shown about which
elements were skipped during their inheritance.

Inheritance also carries information from the decorators of the OpenApi documentation. An important
point in this case will be the use of the context of the data schemas of the child class. To access
this data, use the `ThisRef` function, which returns the `constructor` value of the current
cursor as an argument to the passed function. More on this in the [relevant section](#thisref).

Example

```ts
// CatalogsBase.ts
// initiate a common parent class

// using `ThisRef` define filters that will be applied to search queries
const CatalogsQuery = ThisRef(<T extends typeof CatalogsBase>({ model }: T) => $SafeQuery(model));
// using `ThisRef` define filters that will be applied to incoming data
const CatalogsBody = ThisRef(<T extends typeof CatalogsBase>({ model }: T) => $SafeBody(model));
// using `ThisRef` define the data schema that will be used in the OpenApi documentation
const CatalogsSchema = ThisRef(<T extends typeof CatalogsBase>({ model }: T) => model);

// we describe the route node that the child classes will inherit
@Controller()
class CatalogsBase {
  // we indicate what type of documents will be used in the context of class instances
  document: models.Categories | models.Brands;
  // we indicate in the static property of the class the admissible data models
  static model: typeof models.Categories | typeof models.Brands;
  // parent route nodes can use parameters
  static id = "id";

  static toString() {
    return `:${this.id}(.{24})`;
  }

  // define an endpoint to get a list of data
  @Get()
  @Summary("Data list")
  @Responses({
    status: 200,
    isArray: true,
    // use the `ThisRef` wrapper to get the context value of a specific model at the time of assembling routes
    schema: CatalogsSchema,
  })
  // a previously defined function is used for filtering
  static Index(@Query(CatalogsQuery) query) {
    return this.model.find({ ...query });
  }

  // define an endpoint to add an element
  @Post()
  @Summary("Add value")
  @RequestBody({
    schema: CatalogsSchema,
  })
  @Responses({
    status: 200,
    schema: CatalogsSchema,
  })
  static Add(@Body(CatalogsBody) body) {
    return this.model.create({ ...body });
  }

  // define a middleware to check for the existence of a value
  @Middleware()
  @PathParameters({
    [`${CatalogsBase}`]: {
      name: CatalogsBase.id,
      schema: { type: "string", pattern: "^[0-9,a-f,A-F]{24}$" },
      description: "Идентификатор",
    },
  })
  @Responses({
    status: 404,
    schema: NotFoundError,
  })
  static async Check(
    @This() catalog: CatalogsBase,
    @Params(CatalogsBase.id) id,
    @Next() next,
    @Err() err
  ) {
    catalog.document = await this.model.findById(id);
    if (catalog.document) {
      return next();
    }
    return err("document not found", 404);
  }

  // define a parametric endpoint to edit the value
  @Patch(`${CatalogsBase}`)
  @Summary("Edit value")
  @Use(CatalogsBase.Check)
  @RequestBody({
    schema: CatalogsSchema,
  })
  @Responses({
    status: 200,
    schema: CatalogsSchema,
  })
  static async Update(@This() { document }: CatalogsBase, @Body(CatalogsBody) body) {
    Object.assign(document, { ...body });
    await document.save();
    return document;
  }

  // define a parametric endpoint to remove the value
  @Delete(`${CatalogsBase}`)
  @Summary("Remove value")
  @Use(CatalogsBase.Check)
  @Responses({
    status: 200,
    schema: MessageResponse,
  })
  static async Delete(@This() { document }: CatalogsBase, @Body(CatalogsBody) body) {
    await document.remove();
    return { message: "Документ удален", document };
  }
}

// create a route node `Categories` inherited from the parent class
@Controller()
@AddTag("Categories")
@Use(Categories.Prepare)
class Categories extends CatalogsBase {
  static model = models.Categories;

  @UseTag(Categories)
  @Middleware()
  static Prepare(@Next() next) {
    return next();
  }
}

// create a route node `Categories` inherited from the parent class
@Controller()
@AddTag("Brands")
@Use(Brands.Prepare)
class Brands extends CatalogsBase {
  static model = models.Brands;

  @UseTag(Brands)
  @Middleware()
  static Prepare(@Next() next) {
    return next();
  }
}

// use created route nodes
@Bridge("/categories", Categories)
@Bridge("/brands", Brands)
@AddTag("Catalogs processing")
@Use(Catalogs.Init)
class Catalogs {
  //..
  @UseTag(Catalogs)
  @MergeNextTags()
  @Middleware()
  static Init(@Next() next) {
    return next();
  }
}
```

As a result of this code, two route nodes `Categories` and `Brands` will be created, which will
inherit all `endpoints` and `middleware`, including the documentation decorators, providing a
valid context transfer when using the decorators `@This`, as well as when using the values of
`this` in static methods of the class.

Inheritance in `aom` allows `bridge` constructs to be applied to child route nodes as well.
However, the use of the `@Bridge` decorator implies the use of strictly defined route nodes,
which will be accessed "as is" to the child classes, without performing complex cascading
inheritance procedures.

<a name="thisref"></a>

## Using `ThisRef`

The `ThisRef` function creates a wrapper container to access a child class that inherits the
specific decorators of the parent class.

Accepts as its only argument another function, in which the argument is placed the value of
`constructor` from the current cursor, which in general is a direct inheritor of the class for
which this construct is applied.

The function can be used in the following decorators:

- `@Body` as a function argument, must return a validation function for incoming data
- `@Query` as a function argument, must return a validation function for incoming data
- `@Responses` for the value `schema`, must return the JSON schema of the document
- `@RequestBody` for the value `schema`, must return the JSON schema of the document

If the parent class is used as a self-contained routing node, then `ThisRef` will return its
own value from the parent class, and will work correctly in this situation.
