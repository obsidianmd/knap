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

Variables can contain strings, numbers, booleans, arrays, objects, and nullish values.

| Type | Common uses |
| --- | --- |
| `string` | Titles, content, URLs |
| `number` | Counts and measurements |
| `boolean` | Feature and state flags |
| `array` | Tags, authors, sections |
| `object` | Nested structured data |
| `null` | Missing or empty values |

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

Your app decides which variables are available. See [Variables and resolvers](/api#variables-and-resolvers) to supply or load them.
