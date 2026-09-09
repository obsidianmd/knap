# Web Clipper help compatibility

The regular Knap suite includes executable fixtures from the English Web Clipper Filters and Logic pages in `tests/fixtures/clipper-help.ts`, plus tests that schema paths reach the host resolver intact. JSON examples in the filter docs represent input data; the tests supply them as variables rather than inventing array or object literal syntax for Knap expressions.

Run the consumer checks against sibling `obsidian-clipper` and `obsidian-help` checkouts with their dependencies already installed:

```sh
./node_modules/.bin/vitest run --config compat/clipper.config.ts
```

Override their locations with `CLIPPER_ROOT` and `HELP_ROOT` if needed. The suite uses Clipper's actual compiler, schema variable builder/resolver, and DOM selector adapter, with Knap imports redirected to this checkout's source. It does not update Clipper's installed Knap dependency. Prompt checks verify deferred syntax without contacting an AI provider. Browser extension messaging and model responses are outside this suite.

## September 7, 2026 audit

- Ordinary bracket-then-dot access was missing in Clipper commit `b814405` (January 10, 2026) and remained missing in Knap's initial extraction `ffffcda`. `ed9782a` fixes this. Schema expressions use a separate host resolver path; the three documented `author.name`, `author[0].name`, and `author[*].name` examples work, including explicit `@Article` variants.
- Added coverage exposed lost escapes in quoted regex patterns, merge failures for plain strings and legacy quoted lists, and separators from empty loop iterations. These are covered by the shared fixtures.
- Corrected both help repositories: schema arrays return the full array; the link filter emits newline-separated links; splitting at a trailing separator retains an empty item; `strip_attr` keeps the named attributes; HTML examples need different outer quotes from their attribute values.

These are curated executable fixtures, not an automatic proof of every prose claim in the help. Update them alongside future documentation examples.
