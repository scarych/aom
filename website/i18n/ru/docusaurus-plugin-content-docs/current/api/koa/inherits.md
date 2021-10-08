---
title: Наследование маршрутных узлов
sidebar_position: 5
---

## Механика наследования

`aom` поддерживает механику наследования данных, что позволяет создавать обобщенные маршрутные узлы,
логика которых распространяется на частые случаи.

Наследование выполняется стандартым для JavaScript способом: за счет использования оператора `extends`.

При наследовании для дочернего класса необходимо использовать декоратор класса `@Controller`, так как
именно в нем осуществляется выполнение действий по корректному переносу маршрутов, точек назначения,
middleware и используемых аргументов.

Если в дочернем классе есть собственные статические методы, перегружающие значения родительского класса, то
они останутся без изменений. Аналогично, если в дочернем классе будут существовать `endpoint`-ы
или `bridge`-конструкции, имеющие адреса и методы, аналогичные родительским, то при наследовании они не будут
затронуты. В этом случае, при сборке маршрутной карты будут показаны уведомления о том, какие элементы 
были пропущены при их наследовании.

При наследовании переносится также информация декораторов OpenApi-документации. Важным моментом при этом
будет использование контекста схем данных дочернего класса. Для доступа к этим данным используется
функция `ThisRef`, возвращающая значение `constructor` текущего курсора в аргумент передаваемой функции.
Подробнее об этом в [соответствующем разделе](#thisref).

```ts
// CatalogsBase.ts
// инициируем общий родительский класс

// используя `ThisRef` определим фильтры, которые будут применены к поисковым запросам
const CatalogsQuery = ThisRef(<T extends typeof CatalogsBase>({ model }: T) => $SafeQuery(model));
// используя `ThisRef` определим фильтры, которые будут применены к входящим данным
const CatalogsBody = ThisRef(<T extends typeof CatalogsBase>({ model }: T) => $SafeBody(model));
// используя `ThisRef` определим схему данных, которая будет использоваться в документаци OpenApi
const CatalogsSchema = ThisRef(<T extends typeof CatalogsBase>({ model }: T) => model);

// опишем контроллер, который будут наследовать дочерние классы
@Controller()
class CatalogsBase {
  // укажем, какого типа документы будут использовать в контексте экземпляров класса
  document: models.Categories | models.Brands;
  // укажем в статичном свойстве класса допустимые модели данных
  static model: typeof models.Categories | typeof models.Brands;
  // родительские контроллеры могут использовать параметры
  static id = "id";

  static toString() {
    return `:${this.id}(.{24})`;
  }

  // определим endpoint для получения списка данных
  @Get()
  @Summary("Список данных")
  @Responses({
    status: 200,
    isArray: true,
    // используем `ThisRef` обертку для получения контекстного значения конкретной модели в момент сборки маршрутов
    schema: CatalogsSchema,
  })
  // для фильтрации используется ранее определенная функция
  static Index(@Query(CatalogsQuery) query) {
    return this.model.find({ ...query });
  }

  // определим endpoint для добавления элемента
  @Post()
  @Summary("Добавление данных")
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

  // определим middleware для проверки существования значения
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

  // определим параметрический endpoint для редактирования значения
  @Patch(`${CatalogsBase}`)
  @Summary("Изменение данных")
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

  // определим параметрический endpoint для удаления значения
  @Delete(`${CatalogsBase}`)
  @Summary("Удаление данных")
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

// создадим маршрутный узел `Categories`, унаследованный от родительского класса
@Controller()
@AddTag("Категории товаров")
@Use(Categories.Prepare)
class Categories extends CatalogsBase {
  static model = models.Categories;

  @UseTag(Categories)
  @Middleware()
  static Prepare(@Next() next) {
    return next();
  }
}

// создадим маршрутный узел `Brands`, унаследованный от родительского класса
@Controller()
@AddTag("Бренды товаров")
@Use(Brands.Prepare)
class Brands extends CatalogsBase {
  static model = models.Brands;

  @UseTag(Brands)
  @Middleware()
  static Prepare(@Next() next) {
    return next();
  }
}

// используем созданные маршрутные узлы
@Bridge("/categories", Categories)
@Bridge("/brands", Brands)
@AddTag("Управление каталогом")
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

В результате данной операции будут созданы два маршрутных узла `Categories` и `Brands`, которые унаследуют
все `endpoint`-ы и `middleware`, включая декораторы документации, обеспечив валидный перенос контекста
при использовани декораторов `@This`, а также при использовании значения `this` в статичных методах класса.

Наследование в `aom` допускает применение `bridge`-конструкций, которые также будут применены к дочерним
маршрутным узлам. Однако использование декоратора `@Bridge` подразумевает применение сторого определенных
маршрутных узлов, доступ к которым будут перенесен "как есть" на дочерние классы, без выполнения сложных
каскадных процедур наследования.

<a name="thisref"></a>

## Применение `ThisRef`

Функция `ThisRef` создает обертку-контейнер для получения доступа к дочернему классу, который наследует
специфические декораторы родительского класса.

Принимает единственым аргументом другую функцию, в аргумент которой помещается значение `constructor`
из текущего курсора, которым в общем случае является прямой наследник класса, для которого применяется
данная конструкция.

Функция может быть использована в следующих декораторах:

- `@Body` в качестве аргумента функции, должна возвращать функцию валидации входящих данных
- `@Query` в качестве аргумента функции, должна возвращать функцию валидации входящих данных
- `@Responses` для значения `schema`, должна возвращать JSON-схему документа
- `@RequestBody` для значения `schema`, должна возвращать JSON-схему документа

Если родительский класс используется в качестве самодостаточного маршрутного узла, то `ThisRef`
будет возвращать собственное значение родительского класса, и обеспечит корректную работу в этой
ситуации.
