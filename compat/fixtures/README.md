# Portable rendering fixtures

[render.json](render.json) contains language-independent input/output cases for implementations
of Knap. It is ordinary UTF-8 JSON; consuming it requires no JavaScript runtime,
Vitest, or access to the TypeScript source.

The corpus captures selected, reviewed expectations. Each included case has a
concrete expected result, but this is not a complete language specification.
Passing it means passing these cases, not proving full Knap compatibility.
Behavior that is not covered remains unspecified by this corpus.

## Format version 1

The top-level object contains:

| Field | Meaning |
| --- | --- |
| `format_version` | Fixture format version. Reject unsupported versions. |
| `knap_version` | Package version when the corpus was exported. |
| `preset` | Filter registry to use; currently `standard`. |
| `cases` | Array of independent rendering cases. |

Pin the repository commit or release containing the corpus as well as the format
version. The package version alone does not identify changes between releases.
Case IDs are descriptive identifiers within that pinned corpus; source example
renames can change them.

Each case contains:

| Field | Meaning |
| --- | --- |
| `id` | Unique identifier used in test reports. |
| `source` | Repository-relative source file and example/test name, for review. |
| `template` | Template string to render. |
| `variables` | JSON object supplying the template variables. |
| `expected.output` | Exact rendered string after JSON decoding. |
| `expected.errors` | Ordered array of error code strings. |
| `expected.warnings` | Ordered array of objects containing `code` and `filter`. |

For example:

```json
{
  "id": "example/upper",
  "source": "Illustration of the fixture format",
  "template": "{{ title | upper }}",
  "variables": { "title": "Hello" },
  "expected": { "output": "HELLO", "errors": [], "warnings": [] }
}
```

Render every case with the standard filters, default render options and limits,
fresh variables, and no custom filters or variable resolver. Compare output
exactly, including blank lines and trailing whitespace. Do not normalize Unicode
or line endings. Compare the complete diagnostic code lists, preserving their
order and multiplicity; an empty list means no diagnostics of that kind are
expected. Diagnostic messages and source locations are not compared in format 1.
Inspect the render result rather than using a throw-on-error API: a case can
expect output together with errors or warnings.

Report failed and unsupported cases separately from passes. A partial
implementation should identify which cases it did not execute. The same fixture
data can be used directly by a Rust test harness or any other language's runner.

## Scope

The initial corpus includes executable standard-filter documentation examples,
logic reference examples, the existing Clipper logic fixtures, and selected
parse/filter diagnostic regressions. It covers outputs already authored in the
repository. The diagnostic cases also make existing error and warning
expectations portable.

DOM-dependent HTML filters, application resolvers, custom JavaScript callbacks,
CLI filesystem behavior, parser ASTs, and resource-limit accounting are outside
this corpus. It does not settle all coercion, Unicode, regex, date/time, or
serialization edge cases. New cases in those areas should be reviewed as
explicit compatibility expectations, especially when current behavior might be
a bug. The corpus does not promise portability for arbitrary host objects or
host-dependent time, locale, or DOM behavior.

## Running and updating

The TypeScript runner is part of `pnpm test` and `pnpm check`. Run it alone with:

```sh
pnpm test:compat
```

`tests/fixtures/portable-render.ts` collects hand-authored expectations from the
documentation and selected regression tests. The runner checks that the committed
JSON matches those sources, then renders the cases from the committed JSON.
This keeps the documentation, exported cases, and TypeScript implementation in
agreement without maintaining a second set of expected outputs.

After intentionally changing a source example or adding a reviewed expectation:

```sh
pnpm test:compat --update
pnpm check
```

The update command uses Vitest's external file snapshot support to write plain
JSON. It serializes the authored expectations; it never obtains expected output
by running the renderer. Review the JSON diff and commit it with the source
change. Run `pnpm check` after updating, because the update invocation loads the
previously committed cases before rewriting the file. CI checks freshness and
rendering without updating expectations.
