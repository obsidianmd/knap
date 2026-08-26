---
title: Knap
description: The templating language for Markdown.
---

# The templating language for Markdown

Knap turns application data into Markdown files with YAML frontmatter, using variables, logic, loops, and a focused filter library.

```knap title="template.md"
---
year: {{ year }}
director: {{ directors | wikilink }}
genre: {{ genres }}
---

# {{ title }}

{{ plot | blockquote }}

## Cast

{{ cast | list }}
```

## Quick start

Install Knap with `pnpm add knap`, then read the [API quick start](/api#quick-start).

## Markdown is the output, not an afterthought

Twig and Liquid are at home in web stacks that render HTML. Knap is built for software that creates Markdown files: notes, imports, clippings, and exports with YAML frontmatter.

Its filters produce Markdown primitives directly—including [frontmatter](/filters/yaml), [tables](/filters/table), [footnotes](/filters/footnote), [links](/filters/link), and [blockquotes](/filters/blockquote).

## Powered by Knap

- [Obsidian Web Clipper](https://obsidian.md/clipper)
- [Obsidian Importer](https://community.obsidian.md/plugins/obsidian-importer)
