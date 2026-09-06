---
title: Knap
description: The template language for Markdown.
---

# The template language for Markdown.

Knap is a simple language that lets you generate Markdown content from structured data. It converts data by following a template that you define with [variables](/variables), [filters](/filters), and [logic](/logic).

## Example

### Template

```knap
---
{{ year | yaml_property:"year" }}
{{ directors | wikilink | yaml_property:"director" }}
{{ genres | yaml_property:"genre" }}
---

{{ title | h1 }}

{{ plot | blockquote }}

{% if cast %}
## Cast

{{ cast | slice:0,4 | table_pretty }}
{% endif %}
```

### Markdown

```md
---
year: 1999
director:
  - "[[Lana Wachowski]]"
  - "[[Lilly Wachowski]]"
genre:
  - "Action"
  - "Sci-fi"
---

# The Matrix

> A hacker discovers that reality is a simulation and joins a rebellion against its machines.

## Cast

| Actor              | Role        |
| ------------------ | ----------- |
| Keanu Reeves       | Neo         |
| Laurence Fishburne | Morpheus    |
| Carrie-Anne Moss   | Trinity     |
| Hugo Weaving       | Agent Smith |
```

## Install

Add Knap to your app so users can safely generate Markdown from variables you define.

```shell
npm install knap
```

Or use `pnpm add knap`, `yarn add knap`, or `bun add knap`.

## Knap in use

Knap was created for [Obsidian](https://obsidian.md) and is named after [knapping](https://en.wikipedia.org/wiki/Knapping), the process of shaping stones to form arrowheads, scrapers, and other tools.

- [Obsidian Web Clipper](https://obsidian.md/clipper)
- [Obsidian Importer](https://community.obsidian.md/plugins/obsidian-importer)
