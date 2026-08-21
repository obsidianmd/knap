# Contributing

Pull requests and bug reports are welcome. Please include tests for behavior
changes and run the full verification suite before opening a pull request:

```sh
pnpm check
```

Keep the public API runtime-agnostic. Browser selectors, application state,
and model or prompt execution belong in host integrations supplied through
resolvers and custom filters.
