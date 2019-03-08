# mongoose extension

## aggregators.js
Возвращает функции, применение которых расширяет возможности aggregate запросов 
```js
import { aggregators } from 'aom/mongoose';
const query = [];
```

### objective(value)
Превратить `value` в `ObjectID(value)` или undefined, если данные с ошибкой.
```js 
const {objective} = aggregators;
// or
import {objective} from 'aom/mongoose/aggregators';

const itemId = objective(ctx.query.itemId);
query.push({$match: {itemId}});

model.aggregate(query);
```

### pager({limit, skip, total })
Возвращает конструкцию `pager` для использования ее в качестве ограничителя `limit/offset`
при генерации постраничной навигации.
Если указано значение `total`, делает группировку для подсчета результата количества извлекаемых строк.
```js
import { pager } from 'aom/mongoose/aggregators';

// ctx.query = {limit:10, offset: 0};
query.push(...pager(ctx.query)); 
// query = [{$skip:0}, {$limit: 10}];

// or ctx.query = {total:1};
query.push(...pager(ctx.query)); 
// query = [{$group:{_id:'total', count: {$sum:1}}];
```

### sorter({order})
Принимает аргументом значения вида `{order:'+_id'}`, `{order:'-created'}`.
Возвращает структуру `{_id:1}`, `{created:-1}` для формирования сортировки данных
```js 
import { sorter } from 'aom/mongoose/aggregators';
// ctx.query = {order:'-title'}
const $sort = sorter(ctx.query);
query.push({$sort});
```

### connector(link, key)
Соединяет две коллекции и сохраняет значения в объекте или списке.

В качестве `link` используется объект вида `{ModelName: 'attr'}`.  Буквально читается как
`данные из модели 'ModelName' сохранять в значении 'attr' извлекаемого значения`.

В качестве `key` используется имя аттрибута, по которому происходит связь (`foreign_id`) или объект, устанавливающий направление связи (`{'foreign_id': 'another_id'}`). 
Строковый аргумент эквивалентен значению `{'_id': 'foreign_id'}`.

Если требуется извлечь список, то параметр `key` выглядит как `['foreign_id']`, `[{_id: }]`.

Результатом вызова являются инструкции `[{$lookup:{from: 'ModelName', as: 'attr', foreignField:'foreign_id', localField '_id'}}, {$unwind:{...}}]` для их включения в aggregate.

```js 
import { connector } from 'aom/mongoose/aggregators';
query.push(...connector({Users:'user'}, 'user_id'}));
model.aggregate(query);
// [{_id: 131, type: 'comment', user_id: 42, user: {_id: 42, name: 'John'}}, ...]
```
### $regex(params={})

Применяет поиск по регулярному выражению (без учета регистра) для всех непустых значений из params

```js
import { $regex } from 'aom/mongoose/aggregators';
query.push({$match: $regex({title: '12?', name: 'joh'})});
/* query  = [
    {$match: {
        title: {$regex: '12?', $options: "i"}, 
        name: {$regex: 'joh', $options: "i"} 
        }
    }] */
```

### $in(params={})

Применяет создание списка `$in` для всех непустых значений из params.
```js
import { $in } from 'aom/mongoose/aggregators';
query.push({$match: $in({_id: ['1', '2']}) });
/* query  = [
    { $match: { _id: { $in: [1,2] } }
    }] */
```

## statics.js
Содержит полезные статичные функции для расширения функционала моделей mongoose
```js
import { statics } from 'aom/mongoose';
_.merge(schema.statics, statics);
```
### ensure(data)
Пытается найти значение по данным, или создает его.
```js
//will create object if not exists and return it on another call
modelName.ensure({username: 'Ted'}); 
```
