---
title: Introduction
sidebar_position: 1
---

# AOM: API Over Models

<!-- [Russian readme](https://github.com/scarych/aom/blob/master/readme.ru.md) -->

`aom` - it is meta-framework made of typescript-decorators, which allows to fast and comfortable
create safe api-services, using the principle of accumulation data layers, enriched with abstractions.

## Installation

```
npm i -s aom
```

or

```
yarn add aom
```

## Concept

The main idea sounds like: "don't duplicate the code, link the code". `aom` allows to use data
proccessing, made to cover most cases you need. At the same time `aom` do not limit the developer
in frames of the only framework, but gives the ability to use third-party libraries and packages.

`aom` is not a "thing in itself "- a framework that operates exclusively on its own codebase and only
works in its own environment. Its important feature is the ability to combine with the "classic" code
on `koa`, which makes it useful when migrating functionality already existing projects.

`aom` does not run code in an isolated environment, but generates structures that are compatible with
popular libraries: `koa-router`, `koa-session` and others, which allows, if necessary,
keep the existing code-stack, and comfortably extend it in the `aom` +`typescript` methodology.
