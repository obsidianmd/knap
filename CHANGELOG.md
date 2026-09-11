# Changelog

## 0.4.2

- Add `{# ... #}` template comments, including multiline comments, with syntax errors for unclosed comments.

## 0.4.1

- Add offline CLI help for syntax, filters, and logic tags, with per-filter and per-tag examples and help hints in template diagnostics.
- Add `knap validate` to check template syntax and static filter arguments without data or rendering.

## 0.4.0

- Add `knap batch` to render CSV rows, JSON arrays, or folders of JSON objects into individual files, with filename templates, explicit input formats, CSV piping, dry-run previews, and explicit overwrite support. Reject filename templates that produce empty or separator-only basenames, or leading whitespace.
- Add a `knap render` CLI with file, inline, and stdin template inputs; JSON variables from files, inline data, or stdin; repeatable string overrides; and file or stdout output with automatic parent-directory creation. The existing library entry points remain available.
- Add configurable limits for template size, output size, intermediate values, work operations, and nesting. Engines apply finite defaults, export `defaultRenderLimits`, and return `LIMIT_EXCEEDED` with empty output when a limit is reached.
- Add `allowRegex: false` to make `split` use literal separators and disable regex searches in `replace`. Native regex matching remains enabled by default for compatibility and requires worker or process isolation for untrusted input.
- Resolve only own data properties when reading template variables and filter paths, skipping inherited values and getters. Assign variables without invoking prototype setters.
- Escape literal link labels, image alt text, and Markdown destination delimiters. Omit `javascript:`, `vbscript:`, and `data:` destinations while preserving relative links and application protocols.
- Require literal tag names in `replace_tags`.
- Check opened batch output files before truncating them and avoid following final-path symlinks where supported.

## 0.3.2

- Support dot property access after array indexing, including chained paths such as `cast[0].details.name` and keys that share a keyword name.
- Merge through `merge` using the original array value rather than its serialized form, and treat a single comma-separated argument as a list.
- Preserve regular expression escapes such as `\s` in filter arguments while still decoding escaped quotes and backslashes.
- Remove the extra output line before standalone conditional closing tags, preserving intentional blank lines.
- Preserve intentional blank lines between loop iterations, including separate Markdown tables.
- Skip loop iterations that render nothing so a false condition cannot leave a blank separator or a trailing empty item.
- Apply whitespace control from an `if` tag when an `elseif` or `else` branch is taken.

## 0.3.0

- Revise `truncate` so its suffix counts toward the character limit, and add `truncatewords` for word-based truncation.
- Add property shorthand to `map`, plus `where` for typed property filtering and `sum` for collection totals.
- Expose evaluated filter arguments as `context.rawArguments` while preserving the existing serialized filter parameter string.
- Add `yaml_property` to serialize named properties with automatic block indentation and safe key formatting.
- Preserve singleton arrays through `yaml`, `wikilink`, and `embed`, and preserve typed null values through `yaml`.
- Extend `yaml` to serialize arrays and objects in block style by default, with `yaml:flow` for compact inline collections.
- Add `indent` to indent each non-empty line by a configurable number of spaces (two by default).

## 0.2.3

- Fix parsing of `nth` offset expressions such as `n+3`.

## 0.2.2

- Add the `yaml` standard filter for formatting YAML-safe scalar values.

## 0.2.1

- Rename the npm package from `@obsidianmd/knap` to `knap`.

## 0.1.0

- Extract the shared template tokenizer, parser, AST interpreter, and standard filters from Obsidian Web Clipper.
- Add engine-scoped custom filter registries, asynchronous filters, and asynchronous variable resolution.
- Add structured parse, validation, resolution, filter, and render errors plus non-fatal runtime filter warnings.
- Deduplicate repeated warnings and report runtime filter errors at the filter expression that produced them.
- Add the opt-in `@obsidianmd/knap/html` filter preset.
- Publish ESM, CommonJS, and TypeScript declaration builds.
