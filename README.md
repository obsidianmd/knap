# Knap

Knap is a flexible template language for creating Markdown. It is shared by
Obsidian tools, including [Web Clipper](https://github.com/obsidianmd/obsidian-clipper)
and [Importer](https://github.com/obsidianmd/obsidian-importer).

Knap provides tokenization, parsing, logic, rendering, structured errors, and
filters. Applications supply variables and runtime integrations. Knap uses an
AST interpreter. It does not use `eval` or execute arbitrary JavaScript.

The Obsidian Web Clipper documentation includes examples of Knap's shared
[logic](https://obsidian.md/help/web-clipper/logic),
[filters](https://obsidian.md/help/web-clipper/filters), and
[variable syntax](https://obsidian.md/help/web-clipper/variables).

## Install

```sh
pnpm add knap
```

## CLI

The same package includes a Node.js CLI. Run it with `npx knap`, or install it
globally with `npm install -g knap` to use the `knap` command. Node.js 20 or later
is required. Library imports continue to work independently of the CLI.

```sh
# Render a template using variables from a JSON file
npx knap render template.md --data article.json --output note.md

# Supply a template and variables inline
npx knap render -t '# {{ title }}' --data-json '{"title":"Hello"}'

# Override variables with strings
npx knap render template.md --data article.json --set title="Custom title"

# Pipe JSON data or a template over stdin
cat article.json | npx knap render template.md --data -
cat template.md | npx knap render --data article.json

# Use shell redirection instead of --output
npx knap render template.md --data article.json > note.md

# Render content and metadata extracted by Defuddle
npx defuddle parse https://example.com/article --markdown --json \
  | npx knap render template.md --data - --output note.md
```

In the Defuddle example, template variables such as `{{ title }}` and
`{{ content }}` refer directly to properties of its JSON output.

### CLI options

```text
knap render [template-file] [options]
```

| Option | Short | Purpose |
| --- | --- | --- |
| `[template-file]` | | Template file path, or `-` to read stdin. |
| `--template <text>` | `-t` | Inline template instead of a template file. |
| `--data <file>` | `-d` | JSON variables file, or `-` to read stdin. |
| `--data-json <json>` | | Inline JSON variables object instead of a data file. |
| `--set <key=value>` | | Override a top-level variable with a string; repeatable. |
| `--output <file>` | `-o` | Write to a file; defaults to stdout. `-` explicitly selects stdout. |
| `--help` | `-h` | Show help. |
| `--version` | `-v` | Show the package version. |

Choose one template source and one data source. When no template file or
`--template` is supplied, `render` reads the template from piped stdin. Only
one input can read stdin: with `--data -`, provide a template file or
`--template` explicitly.

Data must be a JSON object. Its properties become template variables, preserving
nested objects, arrays, numbers, booleans, and null. Without data, variables
default to `{}`. `--set` overrides are applied after the JSON data regardless of
argument order; the last override for a key wins. Values are always strings,
including `--set enabled=false`. Keys are literal top-level names, so use JSON
for nested objects. Quote assignments containing spaces, such as
`--set 'First name=Ada'`.

The CLI enables the standard filters. DOM-dependent HTML filters and custom host
integrations remain available through the library API.

Rendered text is written unchanged, without an added newline. An output file is
created or overwritten only after rendering succeeds; missing parent directories
are created automatically. Argument, input, rendering, and filesystem errors exit with status
`1`. Template errors include their code and source location on stderr, leaving
stdout empty and existing output files untouched on rendering failure. Non-fatal
warnings go to stderr and allow output with exit status `0`.

### Batch rendering

Use `batch` to create one file per CSV row, JSON array object, or JSON file in
a folder:

```sh
# One file per CSV row, named using its title
npx knap batch template.md --data articles.csv --output-dir notes \
  --filename '{{ title | safe_name }}.md'

# One file per JSON object in an array
npx knap batch template.md --data articles.json --output-dir notes \
  --filename '{{ title | safe_name }}.md'

# One file per JSON file, preserving the source basename
npx knap batch template.md --data ./articles --output-dir notes

# Pipe a JSON array
cat articles.json | npx knap batch template.md --data - --output-dir notes

# Pipe CSV
cat articles.csv | npx knap batch template.md --data - --format csv --output-dir notes

# Preview output paths without writing files
npx knap batch template.md --data articles.csv --output-dir notes --dry-run
```

CSV files use the first nonempty row as column headers. Values remain strings,
including numbers and booleans. Quoted commas, escaped quotes, embedded newlines,
and UTF-8 BOMs are supported. Blank lines are skipped; duplicate or empty column
headers and inconsistent row lengths are errors.

File input defaults to CSV for `.csv` and JSON otherwise; stdin defaults to JSON.
Use `--format csv` or `--format json` to override detection. Folder input and
`--data-json` require JSON. CSV uses commas; TSV is not supported.

JSON array elements and individual JSON files must be objects. Folder input reads
regular `.json` files in filename order, ignoring subfolders, symlinks, and other
file types. File extensions are case-insensitive. Empty batches are errors.

| Option | Short | Purpose |
| --- | --- | --- |
| `--data <source>` | `-d` | CSV file, JSON array file, folder of JSON objects, or `-` for stdin (JSON by default). |
| `--data-json <json>` |  | Inline JSON array instead of `--data`. |
| `--format <csv\|json>` |  | Override file format detection or select the stdin format. |
| `--output-dir <dir>` |  | Required destination directory; created if needed. |
| `--filename <template>` |  | Filename template evaluated against each record. |
| `--overwrite` |  | Allow replacing existing regular files. |
| `--dry-run` |  | Validate and list output paths without creating directories or writing files. |

Batch supports the same template sources and `--set` overrides as `render`.
Overrides apply to every record, including filename templates. Without
`--filename`, outputs use the source JSON basename with `.md`, or `1.md`, `2.md`,
and so on for CSV rows and JSON array items. Custom filename templates must
include the desired extension and produce a single filename without directories;
use `safe_name` when including data values.
Rendered basenames must contain more than whitespace, dots, hyphens, or
underscores; `.md` and `-.md` are rejected. Leading whitespace is also rejected.
Optional values may be empty if the remaining name is valid. For intentional
dotfiles, start the template with a literal dot, such as `.env` or `.{{ name }}`.

Knap validates input, filenames, and rendered content before writing files.
Duplicate filenames within a batch are errors even with `--overwrite`, including
names that differ only by case or Unicode normalization. Existing files require
`--overwrite`; directories and symlinks cannot be overwritten. Warnings and a
completion summary go to stderr; stdout stays empty except for `--dry-run` paths.
Dry runs perform the same validation and existing-file checks, print one output
path per line only after validation succeeds, and write nothing. Use
`--overwrite --dry-run` to preview replacements. A preview cannot guarantee that
a later write will succeed.
A filesystem failure during
writing can leave some files written, and the error reports how many completed.
Batch data and prepared outputs are held in memory.

## Use

```ts
import {
	createEngine,
	standardFilters,
	type TemplateVariables,
} from 'knap';

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
separately from `knap/html`.

Parameters follow a filter name after a colon, and filters can be chained with
`|`:

```liquid
{{ title | trim | upper }}
{{ published | date:"YYYY-MM-DD" }}
{{ title | h1 }}
{{ source | code:"typescript" }}
{{ json_text | parse_json | bold | join:", " }}
```

Markdown formatting filters apply recursively to string values in arrays and
objects while preserving keys and non-string values. `parse_json` explicitly
turns JSON text into a typed value for collection-aware filter chains.

### Standard filters

| Filter | Purpose |
| --- | --- |
| `blockquote` | Format text as a Markdown block quote. |
| `bold`, `italic`, `strike`, `highlight` | Wrap text in inline Markdown formatting. |
| `calc` | Apply a basic arithmetic operation to a number. |
| `callout` | Format content as a callout. |
| `camel`, `kebab`, `pascal`, `snake` | Convert text to the named casing style. |
| `capitalize`, `lower`, `title`, `upper` | Change text capitalization. |
| `code`, `code_block` | Format inline code or a fenced code block. |
| `comment` | Format a comment. |
| `compact` | Remove null and empty-string values from a collection. |
| `date` | Parse and format a date. |
| `date_modify` | Add or subtract a date unit. |
| `decode_uri`, `encode_uri` | Decode or encode URI component text. |
| `duration` | Format ISO 8601 durations or a number of seconds. |
| `embed` | Format a wiki-style embed. |
| `escape_md` | Escape Markdown punctuation so text renders literally. |
| `first`, `last`, `nth`, `slice` | Select values or ranges from arrays and text. |
| `footnote` | Format values as Markdown footnotes. |
| `fragment_link` | Add text-fragment links using a source URL parameter. |
| `h1`, `h2`, `h3`, `h4`, `h5`, `h6` | Format Markdown headings. |
| `hard_break` | Turn single newlines into Markdown hard line breaks. |
| `hr` | Place a horizontal rule before or after a value. |
| `image` | Format a URL as a Markdown image. |
| `indent` | Indent each non-empty line with spaces. |
| `join`, `split` | Join arrays or split strings. |
| `length` | Return the length of a value. |
| `link`, `wikilink` | Format Markdown links or wikilinks. |
| `list` | Format array-like data as a list. |
| `map` | Select a property from each array item or map items with an expression. |
| `math`, `math_block` | Format inline or block math. |
| `merge` | Merge structured values. |
| `number_format`, `round` | Format or round numeric values. |
| `object` | Select or reshape structured object data. |
| `parse_json` | Parse JSON text into a typed template value. |
| `remove_attr`, `strip_attr` | Remove selected HTML attributes or all except selected attributes. |
| `remove_tags`, `strip_tags` | Remove selected HTML tags or all except selected tags. |
| `replace` | Apply one or more text or regular-expression replacements. |
| `replace_tags` | Replace selected HTML tag names. |
| `reverse`, `unique` | Reverse or deduplicate array-like data. |
| `safe_name` | Sanitize text for use as a file name. |
| `sort` | Sort an array by value or object property. |
| `sum` | Add numeric array values or numeric object properties. |
| `strip_md` | Remove Markdown formatting. |
| `table`, `table_pretty` | Format structured data as a compact or padded Markdown table. |
| `template` | Apply a small value-substitution template to structured data. |
| `trim` | Remove surrounding whitespace. |
| `truncate`, `truncatewords` | Shorten text to a character or word limit. |
| `uncamel` | Convert camel-cased text into words. |
| `unescape` | Unescape encoded text. |
| `where` | Filter array items by an exact property value. |
| `yaml` | Serialize scalars, arrays, or objects as YAML; use `yaml:flow` for compact collections. |
| `yaml_property` | Serialize a named YAML property with automatic indentation. |

Filter metadata, including parameter validation and examples, is exported as
`standardFilterMetadata`. Invalid filter names and invalid parameters are
reported by `engine.validate()` and `engine.render()`.

The `yaml_property` filter formats a complete frontmatter property. Scalars stay
beside the key, and collections use block style with automatic indentation:

```liquid
---
{{ year | yaml_property:"year" }}
{{ directors | wikilink | yaml_property:"director" }}
{{ genres | yaml_property:"genre" }}
---
```

For manual placement, use `yaml` followed by `indent:2` below a property name.
Use `genre: {{ genres | yaml:flow }}` for an inline list. An entire metadata
object can be serialized with `{{ metadata | yaml }}` between the `---` lines.
Collection string values remain quoted, including wikilinks, while numbers,
booleans, and null retain their types.

When a filter cannot use runtime input but preserves that input for
compatibility, `engine.render()` reports a non-fatal structured warning. This
includes values such as an unparseable date or an invalid regular expression.

### HTML parsing

Import `htmlFilters` from `knap/html` to enable:

| Filter | Purpose |
| --- | --- |
| `html_to_json` | Convert HTML elements into structured JSON values. |
| `remove_html` | Remove selected HTML elements and their contents. |

These filters are opt-in because they require browser-compatible DOM globals
such as `DOMParser`; they do not ship in the root runtime graph:

```ts
import { createEngine, standardFilters } from 'knap';
import { htmlFilters } from 'knap/html';

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
} from 'knap';

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
The original typed input is available as `context.rawValue` when a filter needs
to distinguish an array or object from text containing JSON. Evaluated filter
arguments are available as `context.rawArguments`; the serialized `param`
string remains available for compatibility.

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
- `htmlFilters` is available from `knap/html`.

## Development

```sh
pnpm install
pnpm check
```

Knap is available under the [MIT License](LICENSE).
