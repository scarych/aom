How use PSI?

PSI - this is library help create context pseudoclasses with abilities to collapse and uncollapse inner data and build relativites with connections.

```js

PSI(structure, [parents]);

const HashId = PSI(function(key) { return  /* crypt some data with key */ ; })

const id = PSI(Number);
const is = PSI({created: Date, updated: Date, enabled: Boolean});

const Firm = PSI({id, title: String, }, [is]);

const User = PSI({id, name: String, firmId: Firm }, [is]);


User().staticMethod();
new User().objectMethod();

```

Как это в результате должно работать?