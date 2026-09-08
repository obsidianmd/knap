---
title: CLI
description: Generate Markdown in the terminal using templates and JSON data.
---

## Get started

Run Knap with `npx`. The CLI requires Node.js 20 or later.

```shell
npx knap render -t '# {{ title }}' --set title=Hello
```

This prints `# Hello`. To render files, supply a template and a JSON object
containing its variables:

```shell
npx knap render template.md --data data.json --output note.md
```

The CLI is included in the same package as the [library API](/api). It enables
the [standard filters](/filters). DOM-dependent HTML filters and custom app
integrations are available through the library API.

## Installation

For regular use, install Knap globally:

```shell
npm install -g knap
knap render template.md --data data.json --output note.md
```

You can also install Knap in a project with `npm install knap` and run it with
`npx knap` or through an npm script.

## Templates

Pass a template file as the argument after `render`, or use `--template` (`-t`)
for an inline template:

```shell
knap render template.md --data data.json
knap render -t '{{ title | upper }}' --set title=Hello
```

To read a template from stdin, use `-` or omit the template argument:

```shell
cat template.md | knap render - --data data.json
cat template.md | knap render --data data.json
```

Choose one template source per command.

## Data

Use `--data` (`-d`) for a JSON file or `--data-json` for an inline JSON object:

```shell
knap render template.md --data data.json
knap render -t '{{ title }}' --data-json '{"title":"Hello"}'
```

The object's properties become template variables. Nested objects, arrays,
numbers, booleans, and null retain their types. Data must be a JSON object;
without data, variables default to `{}`.

Use `--set` to add or override individual variables:

```shell
knap render template.md --data data.json --set title="Custom title"
knap render -t '{{ First name }}' --set 'First name=Ada'
```

`--set` is repeatable. Overrides are applied after JSON data regardless of
argument order, and the last override for a key wins. Values are always strings,
so `--set enabled=false` supplies the text `false`, not a boolean. Keys are
literal top-level names; use JSON to supply nested objects or other value types.

Choose either `--data` or `--data-json` as the base data source.

## Piping

Use `--data -` to read JSON from another command:

```shell
cat data.json | knap render template.md --data -
```

Only one input can use stdin. When piping data, supply a template file or
`--template` explicitly.

### From Defuddle

[Defuddle](https://github.com/kepano/defuddle) extracts content and metadata from
web pages. Pipe its JSON output into Knap to format the result with your template:

```shell
npx defuddle parse https://example.com/article --markdown --json \
  | npx knap render template.md --data - --output note.md
```

Replace the example URL with the article you want to extract. The template can
reference properties of Defuddle's JSON output directly:

```knap
# {{ title }}

{{ content }}
```

## Output

Rendered text goes to stdout by default, without an added newline. Use
`--output` (`-o`) to write a file, or redirect stdout with your shell:

```shell
knap render template.md --data data.json --output note.md
knap render template.md --data data.json > note.md
```

`--output -` explicitly selects stdout. An output file is created or overwritten
after rendering succeeds; its parent directory must already exist.

### Errors and warnings

Diagnostics go to stderr. Template errors include their code, source, line, and
column. Argument, input, rendering, and filesystem errors exit with status `1`.
Rendering failures produce no output and leave a file passed to `--output`
untouched. Shell redirection follows your shell's behavior and may truncate the
destination before Knap runs.

Non-fatal warnings allow rendering to succeed with exit status `0`.

## Options

```shell
knap render [template-file] [options]
```

| Option | Short | Purpose |
| --- | --- | --- |
| `[template-file]` | | Template file, or `-` for stdin. If omitted, reads a piped template unless `--template` is supplied. |
| `--template <text>` | `-t` | Inline template. |
| `--data <file>` | `-d` | JSON variables file, or `-` for stdin. |
| `--data-json <json>` | | Inline JSON variables object. |
| `--set <key=value>` | | Override a top-level variable with a string; repeatable. |
| `--output <file>` | `-o` | Output file, or `-` for stdout (the default). |
| `--help` | `-h` | Show help. |
| `--version` | `-v` | Show the package version. |
