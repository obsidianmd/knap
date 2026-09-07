---
title: Logic
description: Include content conditionally, choose fallback values, and repeat Markdown over arrays.
---

## Conditionals

Use `{% if %}` to include content only when an expression is true. Add `elseif` and `else` for alternative branches.

```knap title="status.md"
{% if status == "published" %}
Published on {{ published | date:"YYYY-MM-DD" }}
{% elseif status == "draft" %}
Draft
{% else %}
Unknown status
{% endif %}
```

## Comparison and logical operators

| Operator | Meaning | Example |
| --- | --- | --- |
| `==` | Equal to | `status == "draft"` |
| `!=` | Not equal to | `status != "archived"` |
| `>` `<` `>=` `<=` | Ordered comparison | `price >= 100` |
| `contains` | String substring or array member | `tags contains "reference"` |
| `and` / `&&` | Both sides are true | `author and published` |
| `or` / `\|\|` | Either side is true | `draft or archived` |
| `not` / `!` | Negate an expression | `not hidden` |

Use parentheses to make grouped expressions explicit.

```knap
{% if (premium or featured) and published %}
Featured reading
{% endif %}
```

## Truthiness

`false`, `null`, `undefined`, an empty string, `0`, and an empty array are falsy. Other values are truthy.

```knap
{% if content %}
{{ content }}
{% endif %}
```

## Fallback values

The `??` operator returns the first truthy value and has the lowest precedence, so filters run before the fallback check.

```knap
{{ title ?? headline ?? "Untitled" }}
{{ title | upper ?? "UNTITLED" }}
```

## Loops

Use `{% for %}` to render a block once for every value in an array.

```knap
{% for tag in tags %}
- #{{ tag | kebab }}
{% endfor %}
```

Loops can iterate over variables supplied by the host, values created with `set`, and arrays found in nested data.

Iterations are separated by a line break. Extra blank lines before `{% endfor %}` are preserved, so you can separate repeated paragraphs or tables by leaving a blank line inside the loop.

## Loop values

| Value | Description |
| --- | --- |
| `loop.index` | Current iteration, starting at 1 |
| `loop.index0` | Current iteration, starting at 0 |
| `loop.first` | True on the first iteration |
| `loop.last` | True on the last iteration |
| `loop.length` | Total number of items |
| `item_index` | Backwards-compatible 0-based index named after the iterator |

```knap
{% for author in authors %}
{{ loop.index }}. {{ author.name }}{% if loop.last %}.{% else %};{% endif %}
{% endfor %}
```

## Combine and nest logic

Conditions, loops, and assignments can be nested to work with structured data.

```knap
{% for section in sections %}
## {{ section.title }}
{% for item in section.items %}
{% if item.active %}- {{ item.name }}{% endif %}
{% endfor %}
{% endfor %}
```
