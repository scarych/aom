---
title: Дополнительные схемы данных
sidebar_position: 7
---

<!-- # Extra schemas usage -->

## ComponentSchema

`ComponentSchema` - единственный декоратор, который применяется не к маршрутным узлам, а к структурам,
являющихся вложенными (nested) документами в моделях данных, или общим используемым структурам данных,
которые в результате сборки документации окажутся в разделе `Schemas` для общего пользования.

Рекомендуется его использовать для всех моделей и схем данных: `aom` будет создавать ссылки на
указанные типы вида `{$ref: "#/components/schema/ClassName"}`

Использование данного декоратора обусловлено ввиду особенностей работы библиотек `class-validator`
и `class-validator-jsonschema`, требующих соблюдения определенных правил при использовании декоратора
[`@ValidateNested`](https://github.com/epiphone/class-validator-jsonschema#validatenested-and-arrays).

```ts
// ...
// ... модель данных с вложенной структурой (на примере typegoose)
@ComponentSchema()
class Users {
  @prop({ ref: () => Users })
  @IsMongoId()
  userId: Ref<Users>;

  @prop({ type: () => HistoryAction })
  @ValidateNested({ each: true })
  @Type(() => HistoryAction)
  history: HistoryAction[];
}

// ... вложенный документ HistoryAction

// добавим к нему декоратор, который создаст определение, на которое сошлется генератор `json-schema`
@ComponentSchema()
class HistoryAction {
  @prop()
  @IsString()
  action: string;

  @prop()
  @IsDate()
  actionDate: Date;
}
```

Таким образом при генерации документации при обращении к модели данных `Users` будет получена
корректная структура, учитывающая вложенный список.
