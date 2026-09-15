# Contributing

Pull requests and bug reports are welcome. Please include tests for behavior changes and run the full verification suite before opening a pull request:

```sh
pnpm check
```

Keep the public API runtime-agnostic. Browser selectors, application state, and model or prompt execution belong in host integrations supplied through resolvers and custom filters.

The [portable rendering fixtures](compat/fixtures/README.md) make selected
documentation examples and regression expectations reusable by other language
implementations. If a change affects their source examples, update the fixtures
with `pnpm test:compat --update`, review the JSON diff, and run `pnpm check` again.

## Release checks

Before changing the package version, verify both the repository and the exact package contents:

```sh
pnpm check
npm pack --dry-run
```

Keep release notes in `CHANGELOG.md`. Package publication is intentionally a manual maintainer action.
