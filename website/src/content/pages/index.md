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
year: {{ year }}
director: {{ directors | wikilink }}
genre: {{ genres }}
---

# {{ title }}

{{ plot | blockquote }}

{% if cast %}
## Cast

{{ cast | slice:0,4 | table }}
{% endif %}
```

### Markdown

```md
---
year: 1999
director: ["[[Lana Wachowski]]","[[Lilly Wachowski]]"]
genre: ["Action","Sci-fi"]
---

# The Matrix

> A hacker discovers that reality is a simulation and joins a rebellion against its machines.

## Cast

| Actor | Role |
| - | - |
| Keanu Reeves | Neo |
| Laurence Fishburne | Morpheus |
| Carrie-Anne Moss | Trinity |
| Hugo Weaving | Agent Smith |
```

## Install

```shell
npm install knap
```

Or use `pnpm add knap`, `yarn add knap`, or `bun add knap`. Continue with the [API quick start](/api#quick-start).

## Made for applications that create Markdown

- **Safe by design.** An AST interpreter handles templates. Knap does not use `eval` or execute arbitrary JavaScript.
- **Application-owned.** Apps supply variables, asynchronous resolvers, and custom filters. Knap is independent of any host environment.
- **Useful diagnostics.** Errors and warnings include stable codes, messages, lines, and columns for editor tooling and helpful user feedback.

## Powered by Knap

- [Obsidian Web Clipper](https://obsidian.md/clipper)
- [Obsidian Importer](https://community.obsidian.md/plugins/obsidian-importer)
