# Knap

Knap is an environment-neutral template language shared by Obsidian tools. It
owns tokenization, parsing, logic, rendering, structured errors, and filters.
Applications own their variables and runtime integrations.

Knap uses an AST interpreter. It does not use `eval` or execute arbitrary
JavaScript.

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

## Syntax

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

## HTML filters

Filters that require browser-compatible DOM globals are opt-in and do not ship
in the root runtime graph:

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

Defuddle and HTML-to-Markdown conversion are not dependencies of Knap. An
application can register them as custom filters.

## API

- `createEngine({ filters })` creates an immutable engine-scoped registry.
- `engine.render(template, input, options?)` returns output and structured errors.
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

See the [filter reference](FILTERS.md) for the standard and opt-in filters.

## Application boundary

Web Clipper should provide selectors, schema resolution, prompts, models,
browser-tab access, page compilation, and template storage. Importer should
provide vault template selection, imported variables, file paths, properties,
Defuddle data, and preference persistence.

## Development

```sh
pnpm install
pnpm check
```

Knap is available under the [MIT License](LICENSE).
