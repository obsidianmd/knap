---
title: Knap
description: Knap is a simple template language that turns data into Markdown using logic, variables, and filters.
---

# for data shaped into .md

Knap is a simple template language that turns data into Markdown using [logic](/logic), [variables](/variables), and [filters](/filters).

## How it works

Add variables inline with Markdown. Filters let you modify values and formatting.

### Template

```knap
# {{ title }}

**Plot:**
{{ plot | blockquote }}
```

### Output

```md
# The Matrix

**Plot:**
> A hacker discovers that reality is a simulation and joins a rebellion against its machines.
```

Use logic to render variables conditionally and iterate over arrays.

### Template

```knap
{% if cast %}
{{ cast | sort:"Actor" | table }}
{% endif %}
```

### Output

```md
| Actor | Role |
| - | - |
| Carrie-Anne Moss | Trinity |
| Hugo Weaving | Agent Smith |
| Keanu Reeves | Neo |
| Laurence Fishburne | Morpheus |
```

Knap also supports generating YAML frontmatter and Markdown extensions for apps like Obsidian.

### Template

```knap
---
year: {{ year }}
{{ directors | wikilink | yaml_property:"directors" }}
---
```

### Output

```md
---
year: 1999
directors:
  - "[[Lana Wachowski]]"
  - "[[Lilly Wachowski]]"
---
```

## Knap in your terminal

Generate Markdown from Knap templates. Read the [CLI guide](/cli) for options.

```shell
npx knap render template.md --data data.json --output note.md
```

## Knap in your app

Add Knap templating to your app using the [API](/api).

```shell
npm install knap
```

## Explore

### [Variables](/variables)

Insert values from your data into a template.

### [Filters](/filters)

Transform values and format Markdown.

### [Logic](/logic)

Include content conditionally and repeat it over arrays.

## Knap in use

Knap was created for [Obsidian](https://obsidian.md). It is named after [knapping](https://en.wikipedia.org/wiki/Knapping), the process of shaping stones to form arrowheads, scrapers, and other tools.

- [Obsidian Web Clipper](https://obsidian.md/clipper) — Browser extension for saving web pages and highlights to Obsidian with customizable templates.
- [Obsidian Importer](https://community.obsidian.md/plugins/obsidian-importer) — Obsidian plugin for bringing notes from other apps into a consistent Markdown structure.
