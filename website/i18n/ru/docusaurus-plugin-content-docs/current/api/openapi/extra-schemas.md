---
title: Дополнительные схемы данных
sidebar_position: 7
---

<!-- # Extra schemas usage -->

## IsDefinition

`IsDefinition` - единственный декоратор, который применяется не к маршрутным узлам, а к структурам,
являющихся вложенными (nested) документами в моделях данных.

Использование данного декоратора обусловлено ввиду особенностей работы библиотек `class-validator`
и `class-validator-jsonschema`, требующих соблюдения определенных правил при использовании декоратора
[`@ValidateNested`](https://github.com/epiphone/class-validator-jsonschema#validatenested-and-arrays).

**Важно**: классы, к которым применяется данный декоратор, должны использовать метод `static toJSON`
для возврата корректного значения JSON-schema, аналогично примерам указанным выше.

```ts
// ... jsonschema.ts
// ... определим класс, использующий хранилище из `class-transformer` для корректного приведения типов
import { targetConstructorToSchema } from "class-validator-jsonschema";
import { SchemaObject } from "openapi3-ts";
import { defaultMetadataStorage } from "class-transformer/cjs/storage";

export class JSONSchema {
  static toJSON(): SchemaObject {
    return targetConstructorToSchema(this, {
      classTransformerMetadataStorage: defaultMetadataStorage,
    });
  }
}
// ...
// ... модель данных с вложенной структурой (на примере typegoose)
class Users extends BaseModel {
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
@IsDefinition()
class HistoryAction extends JSONSchema {
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
