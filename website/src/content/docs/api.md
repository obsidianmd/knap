---
title: API
description: Add Knap to your app to parse, validate, and render templates.
---

## Install

```shell
pnpm add knap
```

Knap is ESM-first, also ships CommonJS entry points, and requires Node.js 20 or later.

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

Pass an optional generic context when custom filters or resolvers need host data that is not itself a template variable.

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

> **renderOrThrow**  
> Warnings never make `renderOrThrow()` throw. Use it when exceptions fit the host application better than result inspection.

## Engine methods

| Method | Description |
| --- | --- |
| `createEngine({ filters })` | Create an engine with an immutable filter registry. |
| `engine.render(template, input, options?)` | Render asynchronously and return output, errors, and warnings. |
| `engine.renderOrThrow(template, input, options?)` | Return the output or throw `TemplateRenderError`. |
| `engine.parse(template)` | Return the AST and parser diagnostics. |
| `engine.validate(templateOrAst)` | Validate syntax and filter names or parameters. |

Set `{ trimOutput: false }` in render options to preserve surrounding template whitespace.

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

## Package exports

| Import | Includes |
| --- | --- |
| `knap` | Engine, parser, tokenizer, standard filters, diagnostics, and public types. |
| `knap/html` | DOM-dependent `html_to_json` and `remove_html` filters. |
