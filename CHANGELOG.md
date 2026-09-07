# Changelog

All notable changes to Knap will be documented in this file.

## Unreleased

- Revise `truncate` so its suffix counts toward the character limit, and add
  `truncatewords` for word-based truncation.
- Add property shorthand to `map`, plus `where` for typed property filtering
  and `sum` for collection totals.
- Expose evaluated filter arguments as `context.rawArguments` while preserving
  the existing serialized filter parameter string.
- Add `yaml_property` to serialize named properties with automatic block
  indentation and safe key formatting.
- Preserve singleton arrays through `yaml`, `wikilink`, and `embed`, and preserve
  typed null values through `yaml`.
- Extend `yaml` to serialize arrays and objects in block style by default, with
  `yaml:flow` for compact inline collections.
- Add `indent` to indent each non-empty line by a configurable number of spaces
  (two by default).

## 0.2.3

- Fix parsing of `nth` offset expressions such as `n+3`.

## 0.2.2

- Add the `yaml` standard filter for formatting YAML-safe scalar values.

## 0.2.1

- Rename the npm package from `@obsidianmd/knap` to `knap`.

## 0.1.0

- Extract the shared template tokenizer, parser, AST interpreter, and standard
  filters from Obsidian Web Clipper.
- Add engine-scoped custom filter registries, asynchronous filters, and
  asynchronous variable resolution.
- Add structured parse, validation, resolution, filter, and render errors plus
  non-fatal runtime filter warnings.
- Deduplicate repeated warnings and report runtime filter errors at the filter
  expression that produced them.
- Add the opt-in `@obsidianmd/knap/html` filter preset.
- Publish ESM, CommonJS, and TypeScript declaration builds.
