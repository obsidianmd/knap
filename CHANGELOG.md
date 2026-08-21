# Changelog

All notable changes to Knap will be documented in this file.

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
