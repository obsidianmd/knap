---
title: Variables
description: Variables make data accessible in a template.
---

Variables are defined by apps. For example, Obsidian Web Clipper [offers Knap variables](https://help.obsidian.md/web-clipper/variables) that standardize content from web pages.

When a template is rendered by Knap, [variables](/variables) are replaced with values. Variables are wrapped in double braces `{{` and `}}`. Whitespace is optional.

```knap title="Template"
{{ title }}
```

```md title="Output"
The Machine Stops
```

Use [filters](/filters) to modify a value. Filters can be chained, and run from left to right.

```knap title="Template"
{{ title | h2 | upper }}
```

```md title="Output"
## THE MACHINE STOPS
```

## Setting local variables

Use `{% set %}` to name a literal, expression, or filtered value for the rest of the template.

```knap
{% set slug = title | lower | replace:" ":"-" %}
File: {{ slug }}.md
```

Assignments are evaluated in order and can be used by later output and [logic](/logic). See the [`set` reference](/logic/set) for assignment syntax and variable scope.

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
{{ timestamps[loop.index0] }}: {{ line }}
{% endfor %}
```

## Human-readable names

Variable output supports names with spaces, so imported column headings can remain readable without preprocessing.

```knap
{{ First name | trim }}
{{ Publication date | date:"YYYY-MM-DD" }}
```

## Value types

Variables can contain strings, numbers, booleans, arrays, objects, and nullish values.

| Type | Common uses |
| --- | --- |
| `string` | Titles, content, URLs |
| `number` | Counts and measurements |
| `boolean` | Feature and state flags |
| `array` | Tags, authors, sections |
| `object` | Nested structured data |
| <code>null</code> | Missing or empty values |


Building an app with Knap? See [Variables and resolvers](/api#variables-and-resolvers) in the API reference.
