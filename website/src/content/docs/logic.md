---
title: Logic
description: Include content conditionally, use fallbacks, iterate over arrays, and add template comments.
---

Logic tags use `{% ... %}` to control which content is rendered. The tags themselves produce no output.

## Conditions

Use `{% if %}` to include content only when an expression is true. Add `elseif` and `else` for alternative branches. Here, `published` is true.

```knap title="Template"
{% if published %}
Published
{% else %}
Draft
{% endif %}
```

```md title="Output"
Published
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

## True and false

Conditions treat `false`, `null`, `undefined`, an empty string, `0`, and an empty array as false. Other values are treated as true.

```knap
{% if content %}
{{ content }}
{% endif %}
```

## Fallback values

The `??` operator returns the first value treated as true. Values treated as false, including `0` and `false`, use the fallback. Filters run before the fallback check because `??` has the lowest precedence.

```knap
{{ title ?? headline ?? "Untitled" }}
{{ title | upper ?? "UNTITLED" }}
```

## Loops

Use `{% for %}` to render a block once for every value in an array. Here, `tags` contains `science fiction` and `novel`.

```knap title="Template"
{% for tag in tags %}
- #{{ tag | kebab }}
{% endfor %}
```

```md title="Output"
- #science-fiction
- #novel
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

## Comments

Use `{# ... #}` to leave a comment in a template. Comments are removed from the output, and variables, filters, and logic inside them are not evaluated.

```knap title="Template"
Hello{# A note for template authors #} world!
```

```md title="Output"
Hello world!
```

Comments can span multiple lines:

```knap
{#
This template is used for reading notes.
{{ title }} is ignored inside this comment.
#}
```

Surrounding spaces and line breaks are preserved. A comment on its own line leaves that line blank. Comments end at the first `#}` and do not nest. An unclosed comment is a syntax error.

To include an Obsidian-flavored `%%` comment in the rendered Markdown, use the [`comment`](/filters/comment) filter.

## Reference

<!-- LOGIC_DIRECTORY -->
