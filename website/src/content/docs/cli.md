---
title: CLI
description: Generate Markdown files in the terminal using templates, JSON, and CSV data.
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

For `render`, supply one JSON object. To produce a file per record, use
[batch rendering](#batch-rendering).

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
literal top-level names: `--set a.b=hi` defines the key `a.b`, which
`{{ a.b }}` can resolve, rather than creating an object named `a`.
Use JSON to supply nested objects or other value types.

Choose either `--data` or `--data-json` as the base data source.

To render an array into one file, wrap it under a named variable such as
`{"articles": [...]}` and use a loop in the template. Use `batch` for one file
per array item.

## Piping

Use `--data -` to read JSON from another command:

```shell
cat data.json | knap render template.md --data -
```

Only one input can use stdin. When piping data, supply a template file or
`--template` explicitly.

### From Defuddle

[Defuddle](https://defuddle.md/) extracts content and metadata from
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
after rendering succeeds; missing parent directories are created automatically.

### Errors and warnings

Diagnostics go to stderr. Template errors include their code, source, line, and
column. Argument, input, rendering, and filesystem errors exit with status `1`.
Rendering failures produce no output and leave a file passed to `--output`
untouched. Shell redirection follows your shell's behavior and may truncate the
destination before Knap runs.

Non-fatal warnings allow rendering to succeed with exit status `0`.

## Batch rendering

Use `batch` to create many files from one template:

```shell
knap batch template.md --data articles.csv --output-dir notes \
  --filename '{{ title | safe_name }}.md'
```

### Data sources

| Source | One output per | Template variables |
| --- | --- | --- |
| CSV file | Row | Column headers become variable names; values stay strings. |
| JSON array file | Object | Object properties, preserving their types. |
| Folder of JSON files | File | Properties of each file's JSON object. |

```shell
knap batch template.md --data articles.json --output-dir notes
knap batch template.md --data ./articles --output-dir notes
cat articles.json | knap batch template.md --data - --output-dir notes
```

For inline data, use `--data-json` with a JSON array of objects. Piped data defaults
to a JSON array. Use `--format csv` to pipe CSV:

```shell
cat articles.csv | knap batch template.md --data - --format csv --output-dir notes
```

As with `render`, only the template or the data can read
stdin in a single command. `--template` and `--set` work with `batch` too;
overrides apply to every record.

File input uses CSV for a `.csv` extension and JSON otherwise. `--format csv`
or `--format json` overrides that detection, including for files without an
extension. Folder input and `--data-json` require JSON; `--format csv` cannot
be used with them. CSV uses commas as delimiters; TSV is not supported.

The first nonempty CSV row
provides the column headers. Values stay strings, preserving identifiers such
as `00123` and text such as `false`. Quoted commas, escaped double quotes,
embedded newlines, and UTF-8 BOMs are supported. Blank lines are skipped;
empty or duplicate headers and inconsistent row lengths are errors.

Folder input reads regular `.json` files in filename order. It ignores
subfolders, symlinks, and other file types. File extensions are case-insensitive.
Each JSON file must contain one object; JSON array files contain one object per
record. An empty batch is an error.

### Filenames

Without `--filename`, folder input preserves each source basename, changing
`.json` to `.md`. CSV rows and JSON array items are numbered `1.md`, `2.md`, and
so on.

Use a filename template to name files from record values:

```shell
knap batch template.md --data articles.json --output-dir notes \
  --filename '{{ published | date:"YYYY-MM-DD" }}-{{ title | safe_name }}.md'
```

Filename templates use the same variables and standard filters as the content
template. Include the desired extension. A result must be a single filename,
without directory separators, control characters, or characters reserved on
Windows. Use `safe_name` when inserting data values into filenames.

The rendered basename must contain more than whitespace, dots, hyphens, or
underscores. Names such as `.md` or `-.md` fail before any files are written.
Leading whitespace is rejected; use `trim` or `safe_name` to clean data values.
Optional values may be empty when the remaining name is valid, as in
`{{ title }}{{ suffix }}.md`. Use fallback values when needed. For intentional
dotfiles, start the template with a literal dot, such as `.env` or `.{{ name }}`.

### Previewing a batch

Add `--dry-run` to validate the batch and list its intended output paths, one
per line on stdout, without creating directories or writing files:

```shell
knap batch template.md --data articles.csv --output-dir notes --dry-run
```

Dry runs apply the same template, filename, duplicate, and existing-file checks
as a real run. Use `--overwrite --dry-run` to preview replacements. No paths are
printed if validation fails. The summary and warnings go to stderr. A successful
preview does not guarantee a later write will succeed; permissions, available
space, or files may change.

### Existing files and errors

`--output-dir` is required and is created if needed. Existing files cause an
error unless you pass `--overwrite`:

```shell
knap batch template.md --data articles.csv --output-dir notes --overwrite
```

Knap validates the input, filenames, and rendered content for the whole batch
before writing any files. Duplicate output names within a batch always fail,
including names that differ only by case or Unicode normalization. Directories
and symlinks cannot be overwritten.

Warnings and a completion summary go to stderr. Stdout stays empty except when
listing paths with `--dry-run`. Errors
exit with status `1`. A filesystem failure during writing can leave some files
written; the error reports how many completed. Batch data and prepared outputs
are held in memory.

## Render options

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

## Batch options

```shell
knap batch [template-file] --data <source> --output-dir <dir> [options]
```

| Option | Short | Purpose |
| --- | --- | --- |
| `[template-file]` |  | Template file, or `-` for stdin. If omitted, reads a piped template unless `--template` is supplied. |
| `--template <text>` | `-t` | Inline template. |
| `--data <source>` | `-d` | CSV file, JSON array file, JSON folder, or `-` for stdin (JSON by default). |
| `--data-json <json>` |  | Inline JSON array instead of `--data`. |
| `--format <csv\|json>` |  | Override file format detection or select the stdin format. |
| `--set <key=value>` |  | Override a top-level variable in every record with a string; repeatable. |
| `--output-dir <dir>` |  | Required destination directory; created if needed. |
| `--filename <template>` |  | Filename template evaluated against each record. |
| `--overwrite` |  | Allow replacing existing regular files. |
| `--dry-run` |  | Validate and list output paths without creating directories or writing files. |
| `--help` | `-h` | Show help. |
| `--version` | `-v` | Show the package version. |
