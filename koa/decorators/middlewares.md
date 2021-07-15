# Использование middlewares

## Маркеры

Маркеры - это прослойки, которые в случае их применения в цепочке для конкретного endpoint-а (и только
для них), расширяют его метаданные информацией о том, что конечная точка имеет специальную маркировку,
которая выражается в функции, являющейся аргументом маркера.

Как это работает

```ts
class $Access {
  static mark = "hasAccessControl";

  @Middleware()
  @Marker($Access.setMark)
  static async Control(@Next() next, @Route() route, @StateMap($Access) access, @Err() err) {
    return access.checkAccess(route) ? next() : err("access denied", 403);
  }

  static setMark(route: $Route, cursor: $Cursor) {
    route[this.mark] = true;
  }
}
```
