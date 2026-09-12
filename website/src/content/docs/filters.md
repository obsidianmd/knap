---
title: Filters
description: Filters transform variables.
url: https://knap.md/filters
---

Apply a filter to a [variable](/variables) by placing it after a `|` pipe symbol. Filters can be chained, and run from left to right. For example:

```knap title="Template"
{{ title | h2 | upper }}
```

```md title="Output"
## THE MACHINE STOPS
```

Only registered filters are available. Unknown names and invalid parameters appear as diagnostics from `validate()` and `render()`.

## Format Markdown

Markdown filters add common syntax without building delimiters into a template.

```knap
{{ title | h1 }}
{{ summary | italic }}
{{ source | code:"typescript" }}
{{ expression | math }}
{{ footer | hr:before }}
{{ literal_text | escape_md }}
{{ attachment | embed }}
```

Markdown formatting filters recognize typed and serialized arrays and objects, and apply recursively to their string values. Object keys and non-string values remain unchanged, so the result can continue through a collection filter such as <code><span class="syn-filter">join</span></code>.

```knap
{{ tags | bold | join:", " }}
{{ json_text | italic | join:", " }}
```

## Built-in filters

Search filters using `⌘K` to find a filter by name, alias, category, or behavior.

<!-- FILTER_DIRECTORY -->

## HTML filters

<code><span class="syn-filter">html_to_json</span></code> and <code><span class="syn-filter">remove_html</span></code> require browser-compatible DOM globals, so they are exported separately from `knap/html`.

```ts title="engine.ts"
import { createEngine, standardFilters } from 'knap';
import { htmlFilters } from 'knap/html';

const engine = createEngine({
  filters: { ...standardFilters, ...htmlFilters },
});
```

## Register a custom filter

Custom filters may be synchronous or asynchronous. Attach metadata when the editor should validate parameters before rendering.

```ts title="filters.ts"
import { createEngine, standardFilters, type TemplateFilter } from 'knap';

const surround: TemplateFilter = (value, param = '') => {
  const marker = param.replace(/^(['"])(.*)\1$/s, '$2');
  return marker + value + marker;
};

surround.metadata = { example: 'surround:"**"' };

const engine = createEngine({
  filters: { ...standardFilters, surround },
});
```

A filter can call `context.reportWarning()` when it preserves a fallback value but wants the host to surface a non-fatal diagnostic.

Filters receive a serialized string as their first argument for compatibility. The original typed value is available as `context.rawValue` when a custom filter needs to distinguish arrays or objects from text containing JSON. Evaluated arguments are available as `context.rawArguments`; the existing serialized parameter string remains unchanged.
