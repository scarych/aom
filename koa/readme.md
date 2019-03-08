# koa extension
Полезные middleware-конструкции для интеграции их в koa
```js
import {koa} from 'aom`;
```

## router.js
Возвращает готовый объект `koa-router-bridge` (https://www.npmjs.com/package/koa-router-bridge)
```js
const { router } = koa;
// or
import { router } from 'aom/koa';

router.bridge('/users', router => {
    router.get('/', users.list);
    router.post('/', users.add);
    router.bridge('/_:user_id', [user.init], router=> {
        router.get('/', user.info);
        router.post('/', users.save);
    });
});
```

