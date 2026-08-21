# Contributing

Pull requests and bug reports are welcome. Please include tests for behavior
changes and run the full verification suite before opening a pull request:

```sh
pnpm check
```

Keep the public API runtime-agnostic. Browser selectors, application state,
and model or prompt execution belong in host integrations supplied through
resolvers and custom filters.

## Release checks

Before changing the package version, verify both the repository and the exact
package contents:

```sh
pnpm check
npm pack --dry-run
```

Keep release notes in `CHANGELOG.md`. Package publication is intentionally a
manual maintainer action.
