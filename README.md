# Knap

Knap is a simple template language that turns data into Markdown using variables, filters, and logic. It powers templating in [Obsidian Web Clipper](https://obsidian.md/clipper) and [Obsidian Importer](https://community.obsidian.md/plugins/obsidian-importer).

[Documentation](https://knap.md) · [Playground](https://knap.md/playground)

Knap parses templates into an AST and interprets them without `eval` or arbitrary JavaScript execution. Applications control the data and integrations available to templates.

## Install

```sh
npm install knap
```

Node.js 20 or later is required for the CLI.

## CLI

Render a template with JSON data:

```sh
npx knap render template.md --data data.json --output note.md
```

Knap also supports inline templates, validation, batch rendering, CSV input, and offline language help. See the [CLI guide](https://knap.md/cli).

## Library

```ts
import { createEngine, standardFilters } from 'knap';

const engine = createEngine({ filters: standardFilters });

const markdown = await engine.renderOrThrow(
	'# {{ title | trim }}\n\n{{ tags | list }}',
	{
		variables: {
			title: '  An imported note  ',
			tags: ['reference', 'reading'],
		},
	},
);
```

See the [API guide](https://knap.md/api) for rendering, validation, custom filters, asynchronous variables, HTML filters, and execution limits.

## Syntax highlighting

Knap syntax highlighting is available for `.knap` and `.knap.md` templates:

- **VS Code and Cursor:** Download `knap.vsix` from the [latest release](https://github.com/obsidianmd/knap/releases/latest), then choose **Extensions: Install from VSIX** from the command palette.
- **Sublime Text 4:** Download `Knap.sublime-package` from the [latest release](https://github.com/obsidianmd/knap/releases/latest) and place it in Sublime Text's `Installed Packages` folder.
- **Prism:** Run `npm install knap prismjs`, then import the adapter from `knap/prism`.
- **CodeMirror 6:** Run `npm install knap @codemirror/language`, then import the adapter from `knap/codemirror`.
- **highlight.js:** Run `npm install knap highlight.js`, then import the adapter from `knap/highlightjs`.

See the [syntax highlighting guide](https://github.com/obsidianmd/knap/tree/main/editors) for setup examples, CodeMirror 5 support, and editor-specific details.

## Documentation

- [Variables](https://knap.md/variables)
- [Filters](https://knap.md/filters)
- [Logic](https://knap.md/logic)
- [CLI](https://knap.md/cli)
- [API](https://knap.md/api)

## Development

```sh
pnpm install
pnpm check
```

The [portable rendering fixtures](compat/fixtures/README.md) make selected
documentation examples and regression expectations reusable by implementations
in other languages.

Knap is available under the [MIT License](LICENSE).
