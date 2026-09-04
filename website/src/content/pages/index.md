---
title: Knap
description: The templating language for Markdown.
---

# The templating language for Markdown

Knap lets you create reusable templates that turn data into structured Markdown documents.

```knap title="template.md"
---
year: {{ year }}
director: {{ directors | wikilink }}
genre: {{ genres }}
---

# {{ title }}

{{ plot | blockquote }}

## Cast

{{ cast | slice:0,4 | table }}
```

## Quick start

Install Knap with `pnpm add knap`, then read the [API quick start](/api#quick-start).

## Parse it. Knap it. Quick, format it.

Knap is a simple language designed to generate Markdown in a repeatable way. Knap filters are designed to manipulate HTML, JSON, Markdown, and YAML to generate [tables](/filters/table), [links](/filters/link), [lists](/filters/list), [footnotes](/filters/footnote), [blockquotes](/filters/blockquote), and [more](/filters).

```md title="note.md"
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

## Made for applications that create Markdown

- **Safe by design.** An AST interpreter handles templates. Knap does not use `eval` or execute arbitrary JavaScript.
- **Application-owned.** Apps supply variables, asynchronous resolvers, and custom filters. Knap is independent of any host environment.
- **Useful diagnostics.** Errors and warnings include stable codes, messages, lines, and columns for editor tooling and helpful user feedback.

## Powered by Knap

- [Obsidian Web Clipper](https://obsidian.md/clipper)
- [Obsidian Importer](https://community.obsidian.md/plugins/obsidian-importer)

## Documentation

- [Variables](/variables)
- [Logic](/logic)
- [Filters](/filters)
- [API](/api)
