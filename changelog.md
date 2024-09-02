#### 1.0.0-beta.45

- Extend 'ICursor' type with `index:number` value

#### 1.0.0-beta.44

- Decorator `Summary` became `CombinedDecorator` and allows append to controllers

#### 1.0.0-beta.43

- Export `getOpenAPIMetadata` from `common/functions`

#### 1.0.0-beta.42

- Export `restoreReverseMetadata` and `saveReverseMetadata` from `koa/functions`
- Add debug information about mismatched `Endpoint` decorator

#### 1.0.0-beta.41

- Append `Promise` for return type of `NextFunction`

#### 1.0.0-beta.40

- Increase `class-validator`, `class-validator-jsonschema` and ``class-transformer` version. `openapi3-ts` placed to dependecies

#### 1.0.0-beta.39

- Improve `@Params` and `@Headers` decorators: added support for data validation like `@Body` and `@Query`

#### 1.0.0-beta.38

- Modified `@ComponentSchema` processing: added auto `displayName` call with default class name

#### 1.0.0-beta.37

- Fixed middlewares inheritances: replace constructor value for origin on extends

#### 1.0.0-beta.36

- Fixed `DelayRefStack` decorators processing

#### 1.0.0-beta.35

- Fixed `KoaContext` naming

#### 1.0.0-beta.34

- Fixed strange bug into `mergeOpenAPIHandlerMetadata` function
- Minor files refactoring

#### 1.0.0-beta.33

- Added `AdditionalConverter` decorator

#### 1.0.0-beta.32

- Added `DelayRefStack` decorator
- #### 1.0.0-beta.31

- Improved controller inheritance process (added cascade controller parent search)
- Added `toJSON` condition to `toJSONSchema` function

#### 1.0.0-beta.30

- Added filter parameters with empty schemas

#### 1.0.0-beta.29

- Added support for `ThisRef` and `RouteRef` to `PathParameters` and `QueryParameters` decorators
- #### 1.0.0-beta.28

- Added `@DisplayName`: to define special display name for schemas and api methods
- Added `@NoJSONSchema`: to prevent call `targetConstructorToSchema` for special classes

#### 1.0.0-beta.27

- Added support for `FwdRef` to `UseNext` decorator

#### 1.0.0-beta.26

- Added `class-validator`, `class-transformer` and `class-validator-jsonschema` to core dependecies
- Refactored JSON-schema generation: OpenAPI build JSON-schemas itself

#### 1.0.0-beta.25

- Fixed critical bug with `@This` context definition

#### 1.0.0-beta.24

- Added `@QueryParameters` to `aom/openapi` decorators
- Marked `@Parameters` as **deprecated**
- Improved `parameterId` generation: used only endpoint class and property name

#### 1.0.0-beta.23

- Fixed bug with endpoint metadata definition

#### 1.0.0-beta.22

- Fixed OpenApi summary and description processing

#### 1.0.0-beta.21

- Added `RouteRef` function
- Fixed OpenApi generation processing

#### 1.0.0-beta.20

- Fixed bug with cursor context loss inside `nextSequences` function
- Improved `Controller` processing: added tranfer node used middlewares

#### 1.0.0-beta.19

- Fixed bug inside `CombineSchemas`
- Fixed bug inside openapi builder

#### 1.0.0-beta.17

- Decorator `@IsDefinition` renamed to `@ComponentSchema`
- Changed required attributes for openapi interfaces
- Removed unnecessary dependencies

#### 1.0.0-beta.16

- Added `readme.md` badges

#### 1.0.0-beta.15

- Added `@Controller` decorator
- Added routes classes inheritance
- Added `@UseNext` decorator
- Added openapi parametric context schema: `CursorRef` function

#### 1.0.0-beta.13

- Added Docusaurus manual
- Added lazy endpoints support

#### 1.0.0-beta.12

- Rewrited base code on Typescript
- Added `npm build` and `npm prepublish` commands

#### 1.0.0-beta.11

- Added `FwdRef` function
- Added `changelog` to `readme.md`
