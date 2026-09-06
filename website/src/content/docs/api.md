---
title: API
description: Add Knap to your app to parse, validate, and render templates.
---

<!-- INSTALL -->

## Quick start

```ts
import {
  createEngine,
  standardFilters,
  type TemplateVariables,
} from 'knap';

const engine = createEngine({ filters: standardFilters });

const variables: TemplateVariables = {
  title: '  An imported note  ',
  tags: ['reference', 'reading'],
};

const result = await engine.render(
  '# {{ title | trim }}\n\n{{ tags | list }}',
  { variables },
);
```

## Variables and resolvers

Pass variables in each render call. Knap accepts unknown application values rather than imposing a schema.

Knap does not know what a browser tab, vault, selector, or model is. Applications can expose those concepts as ordinary values or resolve them on demand.

If a value is not present in the variables object, the host can load it with `resolveVariable`. Local values always take precedence. Pass an optional generic context when custom filters or resolvers need host data that is not itself a template variable.

```ts
const result = await engine.render('{{ remoteValue | upper }}', {
  variables: {},
  context: { documentId: 'example' },
  resolveVariable: async (name, { context }) => {
    if (name === 'remoteValue') {
      return loadValue(context.documentId);
    }
    return undefined;
  },
});
```

## Render results

`render()` always resolves to an output object with structured diagnostics.

| Field | Type | Description |
| --- | --- | --- |
| `output` | `string` | Rendered Markdown. Empty when parsing fails. |
| `errors` | `TemplateError[]` | Fatal parser, validation, resolver, or filter errors. |
| `warnings` | `TemplateWarning[]` | Non-fatal diagnostics reported by filters. |

Errors include a stable `code`, `message`, `line`, and `column`. Warnings also identify the reporting filter and are deduplicated per render.

```ts
if (result.errors.length === 0) {
  console.log(result.output);
}

const output = await engine.renderOrThrow(
  '{{ title | upper }}',
  { variables },
);
```

> **renderOrThrow** — Warnings never make `renderOrThrow()` throw. Use it when exceptions fit the host application better than result inspection.

## Engine methods

| Method | Description |
| --- | --- |
| `createEngine({ filters })` | Create an engine with an immutable filter registry. |
| `engine.render(template, input, options?)` | Render asynchronously and return output, errors, and warnings. |
| `engine.renderOrThrow(template, input, options?)` | Return the output or throw `TemplateRenderError`. |
| `engine.parse(template)` | Return the AST and parser diagnostics. |
| `engine.validate(templateOrAst)` | Validate syntax and filter names or parameters. |

Set `{ trimOutput: false }` in render options to preserve surrounding template whitespace.

## Execution model

Knap parses templates into an AST and interprets them without using `eval` or executing arbitrary JavaScript. Applications control the variables, asynchronous resolvers, and custom filters available to each engine.

## Editor tooling

The lower-level exports let editors tokenize once, inspect an AST, and validate variables or filters independently.

```ts
import {
  parse,
  standardFilterMetadata,
  validateFilters,
  validateVariables,
} from 'knap';

const parsed = parse(template);
const filterErrors = validateFilters(parsed.ast, standardFilterMetadata);
const variableNames = validateVariables(parsed.ast);
```

`applyFiltersWithRegistry()` applies a synchronous filter chain when a host needs Knap filter syntax outside a full render.

Filter callbacks receive the compatibility string value as their first argument. `FilterContext.rawValue` contains the original typed value for filters that need to distinguish collections from literal JSON text.

## Package exports

| Import | Includes |
| --- | --- |
| `knap` | Engine, parser, tokenizer, standard filters, diagnostics, and public types. |
| `knap/html` | DOM-dependent `html_to_json` and `remove_html` filters. |
