# Knap

Knap is a template language shared by Obsidian tools, including
[Web Clipper](https://github.com/obsidianmd/obsidian-clipper) and
[Importer](https://github.com/obsidianmd/obsidian-importer).

Knap provides tokenization, parsing, logic, rendering, structured errors, and
filters. Applications supply variables and runtime integrations. Knap uses an
AST interpreter. It does not use `eval` or execute arbitrary JavaScript.

The Obsidian Web Clipper documentation includes examples of Knap's shared
[logic](https://obsidian.md/help/web-clipper/logic),
[filters](https://obsidian.md/help/web-clipper/filters), and
[variable syntax](https://obsidian.md/help/web-clipper/variables).

## Install

```sh
pnpm add @obsidianmd/knap
```

## Use

```ts
import {
	createEngine,
	standardFilters,
	type TemplateVariables,
} from '@obsidianmd/knap';

const engine = createEngine({ filters: standardFilters });

const variables: TemplateVariables = {
	title: '  An imported note  ',
	tags: ['reference', 'reading'],
};

const result = await engine.render(
	`# {{ title | trim }}

{% if tags %}Tags: {{ tags | join:", " }}{% endif %}`,
	{ variables },
);

if (result.errors.length === 0) {
	console.log(result.output);
}
```

Every error contains a stable `code`, `message`, `line`, and `column`. Use
`renderOrThrow()` when exceptions fit the calling application better:

```ts
const output = await engine.renderOrThrow('{{ title | upper }}', { variables });
```

Filters that deliberately preserve their input after invalid runtime data can
report non-fatal diagnostics in `result.warnings`. Each warning includes a
stable `code`, `message`, `filter`, `line`, and `column`. Warnings do not make
`renderOrThrow()` throw. Identical warnings from repeated evaluation of the
same filter expression are deduplicated within each render.

## Syntax

The syntax is inspired by Twig and Liquid.

```liquid
{{ title }}
{{ title | upper }}
{{ published | date:"YYYY-MM-DD" }}
{{ First name | trim }}

{% if author %}
By {{ author.name }}
{% elseif site %}
From {{ site }}
{% else %}
Unknown source
{% endif %}

{% for item in links %}
- {{ item.title }}: {{ item.url }}
{% endfor %}

{% set heading = title | upper %}
```

The language supports chained filters, `if`/`elseif`/`else`, `for`, `set`,
nested properties, array access, comparisons, boolean operators, nullish
fallbacks, and whitespace control.

## Application variables

Values absent from the variables object can be resolved asynchronously. Knap
does not know what a browser tab, vault, selector, schema, or model is.

```ts
const result = await engine.render('{{ remoteValue | upper }}', {
	variables: {},
	context: { documentId: 'example' },
	resolveVariable: async (name, { context }) => {
		if (name === 'remoteValue') {
			return loadValue(context.documentId);
		}
		return undefined;
	},
});
```

Local variables take precedence over the resolver.

## Filters

Filters are registered explicitly when an engine is created. The standard
registry is available as `standardFilters`; DOM-dependent filters are available
separately from `@obsidianmd/knap/html`.

Parameters follow a filter name after a colon, and filters can be chained with
`|`:

```liquid
{{ title | trim | upper }}
{{ published | date:"YYYY-MM-DD" }}
```

### Standard filters

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

### HTML preset

Import `htmlFilters` from `@obsidianmd/knap/html` to enable:

| Filter | Purpose |
| --- | --- |
| `html_to_json` | Convert HTML elements into structured JSON values. |
| `remove_html` | Remove selected HTML elements and their contents. |

These filters are opt-in because they require browser-compatible DOM globals
such as `DOMParser`; they do not ship in the root runtime graph:

```ts
import { createEngine, standardFilters } from '@obsidianmd/knap';
import { htmlFilters } from '@obsidianmd/knap/html';

const engine = createEngine({
	filters: {
		...standardFilters,
		...htmlFilters,
	},
});
```

## Custom filters

The engine's filter registry is used for both validation and rendering.
Filter parameters use Knap's colon-delimited parameter syntax.

```ts
import {
	createEngine,
	standardFilters,
	type TemplateFilter,
} from '@obsidianmd/knap';

const markdown: TemplateFilter = (html, param, context) => {
	const baseUrl = param?.replace(/^(['"])(.*)\1$/s, '$2');
	return convertToMarkdown(html, baseUrl, context);
};

markdown.metadata = {
	example: 'markdown:"https://example.com"',
	validateParams: param => ({
		valid: Boolean(param),
		error: 'requires a base URL',
	}),
};

const engine = createEngine({
	filters: {
		...standardFilters,
		markdown,
	},
});
```

Custom filters may be asynchronous. A filter can also report a non-fatal
diagnostic while returning a fallback value:

```ts
const lookup: TemplateFilter = async (value, _param, context) => {
	const result = await findValue(value);
	if (result === undefined) {
		context?.reportWarning?.({ message: `Could not find ${value}` });
		return value;
	}
	return result;
};
```

The filter parameter is passed in its serialized Knap form so filters that
accept multiple parameters can preserve delimiters and quoting. A custom filter
that expects one scalar parameter can normalize surrounding quotes as above.

Host data needed by a custom filter belongs in the generic engine context:

```ts
type HostContext = { sourceUrl: string };

const sourceLink: TemplateFilter<HostContext> = (value, _param, filterContext) => {
	return `[${value}](${filterContext?.context?.sourceUrl})`;
};

const engine = createEngine<HostContext>({
	filters: { ...standardFilters, source_link: sourceLink },
});

await engine.render('{{ title | source_link }}', {
	variables: { title: 'Knap' },
	context: { sourceUrl: 'https://example.com' },
});
```

## API

- `createEngine({ filters })` creates an immutable engine-scoped registry.
- `engine.render(template, input, options?)` returns output, structured errors,
  and non-fatal warnings.
- `engine.renderOrThrow(template, input, options?)` returns output or throws `TemplateRenderError`.
- `engine.parse(template)` returns the AST and parser diagnostics.
- `engine.validate(templateOrAst)` validates syntax and the configured filters.
- `tokenize(template)`, `parse(template)`, `validateVariables(ast)`, and
  `validateFilters(ast, metadata)` support editor tooling.
- `standardFilters` contains environment-neutral filters.
- `standardFilterMetadata` describes the standard registry for standalone validation.
- `applyFiltersWithRegistry(value, filterString, registry, context)` applies a filter
  chain when a host needs filter syntax outside a full render.
- `htmlFilters` is available from `@obsidianmd/knap/html`.

## Development

```sh
pnpm install
pnpm check
```

Knap is available under the [MIT License](LICENSE).
