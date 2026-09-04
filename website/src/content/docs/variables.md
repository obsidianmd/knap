---
title: Variables
description: Variables bridge application data and a Knap template.
---

## Output a value

Wrap a variable name in double braces. Whitespace inside the braces is optional.

```knap title="template.md"
# {{ title }}

By {{author}}
```

Use [filters](/filters) to transform a value. Filters can be chained, and run from left to right.

```knap
{{ title | trim | title }}
{{ tags | join:", " }}
```

## Value types

Knap accepts unknown application values rather than imposing a schema. Templates commonly work with strings, numbers, booleans, arrays, objects, and nullish values.

| Type | Common uses |
| --- | --- |
| `string` | Titles, content, URLs |
| `number` | Counts and measurements |
| `boolean` | Feature and state flags |
| `array` | Tags, authors, sections |
| `object` | Nested structured data |
| `null` | Missing or empty values |

Knap does not know what a browser tab, vault, selector, or model is. Applications can expose those concepts as ordinary values or resolve them on demand.

## Nested values

Use dot notation for nested object properties and bracket notation for array items or keys that are easier to express as strings.

```knap
{{ author.name }}
{{ authors[0].name }}
{{ metadata["article:section"] }}
```

Bracket expressions can also use another variable, which is useful when two arrays need to be read in parallel.

```knap
{% for line in transcript %}
{{ timestamps[loop.index0] }} — {{ line }}
{% endfor %}
```

## Local variables

Use `{% set %}` to name a literal, expression, or filtered value for the rest of the template.

```knap
{% set slug = title | lower | replace:" ":"-" %}
File: {{ slug }}.md
```

Assignments are evaluated in order and can be used by later output, conditions, and loops.


## Use human-readable names

Variable output supports names with spaces, so imported column headings can remain readable without preprocessing.

```knap
{{ First name | trim }}
{{ Publication date | date:"YYYY-MM-DD" }}
```

## Resolve values asynchronously

If a value is not present in the variables object, the host can load it with `resolveVariable`. Local values always take precedence.

```ts title="render.ts"
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