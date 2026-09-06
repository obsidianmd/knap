---
title: Filters
description: Filters transform variables.
---

## Use filters

Add a filter after a pipe. Parameters follow the filter name after a colon, and chains run from left to right.

```knap title="template.md"
{{ title | trim | upper }}
{{ published | date:"YYYY-MM-DD" }}
{{ tags | unique | join:", " }}
```

Only filters registered on the engine are available. Unknown names and invalid parameters appear as structured diagnostics from `validate()` and `render()`.

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
