# Filter reference

Filters are registered explicitly when an engine is created. The standard
registry is available as `standardFilters`; DOM-dependent filters are available
separately from `@obsidianmd/knap/html`.

Parameters follow a filter name after a colon, and filters can be chained with
`|`:

```liquid
{{ title | trim | upper }}
{{ published | date:"YYYY-MM-DD" }}
```

## Standard filters

| Filter | Purpose |
| --- | --- |
| `blockquote` | Format text as a Markdown block quote. |
| `calc` | Apply a basic arithmetic operation to a number. |
| `callout` | Format content as an Obsidian callout. |
| `camel`, `kebab`, `pascal`, `snake` | Convert text to the named casing style. |
| `capitalize`, `lower`, `title`, `upper` | Change text capitalization. |
| `date` | Parse and format a date. |
| `date_modify` | Add or subtract a date unit. |
| `decode_uri` | Decode percent-encoded URI text. |
| `duration` | Format ISO 8601 durations or a number of seconds. |
| `first`, `last`, `nth`, `slice` | Select values or ranges from arrays and text. |
| `footnote` | Format values as Markdown footnotes. |
| `fragment_link` | Add text-fragment links using a source URL parameter. |
| `image` | Format a URL as a Markdown image. |
| `join`, `split` | Join arrays or split strings. |
| `length` | Return the length of a value. |
| `link`, `wikilink` | Format Markdown links or Obsidian wikilinks. |
| `list` | Format array-like data as a list. |
| `map` | Map fields from structured array data. |
| `merge` | Merge structured values. |
| `number_format`, `round` | Format or round numeric values. |
| `object` | Select or reshape structured object data. |
| `remove_attr`, `strip_attr` | Remove selected HTML attributes or all except selected attributes. |
| `remove_tags`, `strip_tags` | Remove selected HTML tags or all except selected tags. |
| `replace` | Apply one or more text or regular-expression replacements. |
| `replace_tags` | Replace selected HTML tag names. |
| `reverse`, `unique` | Reverse or deduplicate array-like data. |
| `safe_name` | Sanitize text for use as a file name. |
| `strip_md`, `stripmd` | Remove Markdown formatting. |
| `table` | Format structured data as a Markdown table. |
| `template` | Apply a small value-substitution template to structured data. |
| `trim` | Remove surrounding whitespace. |
| `uncamel` | Convert camel-cased text into words. |
| `unescape` | Unescape encoded text. |

Filter metadata, including parameter validation and examples, is exported as
`standardFilterMetadata`. Invalid filter names and invalid parameters are
reported by `engine.validate()` and `engine.render()`.

When a filter cannot use runtime input but preserves that input for
compatibility, `engine.render()` reports a non-fatal structured warning. This
includes values such as an unparseable date or an invalid regular expression.

## HTML preset

Import `htmlFilters` from `@obsidianmd/knap/html` to enable:

| Filter | Purpose |
| --- | --- |
| `html_to_json` | Convert HTML elements into structured JSON values. |
| `remove_html` | Remove selected HTML elements and their contents. |

These filters require browser-compatible DOM globals such as `DOMParser`, so
they are not part of the root runtime graph.
