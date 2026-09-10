import { filterDocsByName, type FilterExample } from '../docs/filter-docs';
import { standardFilterMetadata } from '../filters';
import { syntaxHelp, tagHelp } from './language-help';

export const help = `Usage: knap render [template-file] [options]
       knap batch [template-file] --data <source> --output-dir <dir> [options]
       knap validate [template-file] [-t <text>]
       knap help [syntax|filters|tags|filter <name>|tag <name>]

Render a Knap template using JSON variables and standard filters.

Language reference (available offline):
  knap help syntax         Variables, filter chaining, logic, whitespace
  knap help filters        Every CLI filter with a short description
  knap help filter date    Syntax, parameters, examples, and expected output
  knap help tags           Every logic tag with a short description
  knap help tag for        Syntax and examples for a logic tag
  knap validate --help     Check a template without rendering or data

Arguments:
  template-file            Template file, or "-" for stdin. If omitted, read
                           piped stdin unless --template supplies the template.

Options:
  -t, --template <text>    Inline template (instead of a template file)
  -d, --data <file>        JSON variables file, or "-" for stdin
      --data-json <json>   Inline JSON variables object (instead of --data)
      --set <key=value>    Override a top-level variable with a string; repeatable
  -o, --output <file>      Output file, or "-" for stdout (default: stdout)
  -h, --help               Show help
  -v, --version            Show version

Batch options:
  -d, --data <source>      CSV file, JSON array file, folder of JSON objects,
                           or "-" for stdin (JSON by default)
      --format <csv|json>  Input format: csv or json (overrides file extension)
      --data-json <json>   Inline JSON array of objects (instead of --data)
      --output-dir <dir>   Destination directory (created if needed)
      --filename <text>    Filename template, e.g. '{{ title | safe_name }}.md'
      --overwrite          Replace existing files (duplicates in a batch fail)
      --dry-run            Validate and list output paths without writing files

Batch also accepts --template and --set. Default filenames preserve JSON file
names or number CSV rows and array items as 1.md, 2.md, etc. CSV values stay
strings. Filenames must not contain directories. Output summaries go to stderr.
Dry runs list paths on stdout; existing files still require --overwrite.
Render output creates parent directories if needed.

Examples:
  knap render template.md --data article.json -o note.md
  knap render -t '# {{ title }}' --set title=Hello
  cat article.json | knap render template.md --data -
  cat template.md | knap render --data article.json
  knap batch template.md --data articles.csv --output-dir notes
  knap batch template.md --data ./articles --output-dir notes

Only one input may use stdin. Render data must be a JSON object; defaults to {}.
Diagnostics go to stderr. Rendering errors exit with status 1 without writing
output. Warnings do not prevent output. Rendered text is written unchanged.
`;

export const validationHelp = `Usage: knap validate [template-file] [-t <text>]

Check template syntax, filter names, and statically checkable filter arguments.
No data is required and no template is rendered. Variable existence, runtime
values, and dynamic filter arguments are not checked. Render with real data
to check those arguments and runtime behavior.

  template-file          Template file, or "-" for stdin
  -t, --template <text>  Inline template instead of a file
  -h, --help             Show this help

Choose one template source. With no file or --template, read piped stdin.
Data, output, and batch options are not accepted.
Success exits 0; errors exit 1. Diagnostics and the success message go to
stderr; stdout stays empty. No files are written.

Examples:
  knap validate template.md
  knap validate -t '{{ title | upper }}'
  cat template.md | knap validate

Reference: knap help syntax | knap help filters | knap help tags
`;

function exampleText(example: FilterExample): string {
	return `${example.title}:\n  Data: ${JSON.stringify(example.variables)}\n  Template: ${JSON.stringify(example.template)}\n  Output: ${JSON.stringify(example.expected)}`;
}

export function topicHelp(args: string[]): string {
	if (args.length === 0) return help;
	const [topic, name] = args;
	if (topic === 'syntax' && args.length === 1) return syntaxHelp;
	if (topic === 'filters' && args.length === 1) {
		const rows = Object.keys(standardFilterMetadata).sort().map(filter => {
			const doc = filterDocsByName.get(filter)!;
			const summary = filter === doc.name ? doc.summary : `Alias for ${doc.name}. ${doc.summary}`;
			return `  ${filter.padEnd(18)} ${summary}`;
		});
		return `CLI filters\n\n${rows.join('\n')}\n\nUse knap help filter <name> for syntax, parameters, and examples.\nDOM-dependent html_to_json and remove_html require the library API and are\nnot available in the CLI. Host integrations such as markdown conversion,\nbrowser selectors, and prompts are not supplied by the CLI.\n`;
	}
	if (topic === 'filter' && args.length === 2) {
		if (!Object.hasOwn(standardFilterMetadata, name)) {
			const doc = filterDocsByName.get(name);
			if (doc?.environment === 'html') {
				throw new Error(`Filter "${name}" requires DOM globals and the knap/html library preset; it is not available in the CLI. Run knap help filters for available filters.`);
			}
			throw new Error(`Unknown filter "${name}". Run knap help filters for available filters.`);
		}
		const doc = filterDocsByName.get(name)!;
		const metadata = standardFilterMetadata[name];
		const sections = [
			`${name}${name === doc.name ? '' : ` (alias for ${doc.name})`}\n\n${doc.summary}`,
			`Syntax:\n${doc.syntax.map(syntax => `  {{ value | ${name + syntax.slice(doc.name.length)} }}`).join('\n')}`,
			`Parameters:\n${(doc.parameters ?? ['See syntax and examples for supported usage.']).map(parameter => `  ${parameter}`).join('\n')}`,
		];
		if (metadata.example) sections.push(`Parameter example: {{ value | ${metadata.example} }}`);
		if (doc.notes?.length) sections.push(`Notes:\n${doc.notes.map(note => `  ${note}`).join('\n')}`);
		if (doc.referenceTables?.length) {
			for (const table of doc.referenceTables) {
				sections.push(`${table.title}:\n${table.description}\n${[table.columns, ...table.rows].map(row => `  ${row.join(' | ')}`).join('\n')}`);
			}
		}
		sections.push('Examples (JSON strings show exact whitespace):\n\n' + doc.examples.map(exampleText).join('\n\n'));
		sections.push('Reference: knap help filters | knap help syntax');
		return sections.join('\n\n') + '\n';
	}
	if (topic === 'tags' && args.length === 1) {
		return `Logic tags\n\n${Object.entries(tagHelp).map(([tag, doc]) => `  ${tag.padEnd(10)} ${doc.summary}`).join('\n')}\n\nTags use {% ... %}. Use knap help tag <name> for syntax and examples.\n`;
	}
	if (topic === 'tag' && args.length === 2) {
		if (!Object.hasOwn(tagHelp, name)) throw new Error(`Unknown tag "${name}". Run knap help tags for available tags.`);
		const doc = tagHelp[name];
		return `${name}\n\n${doc.summary}\n\nSyntax:\n  ${doc.syntax}\n\n${doc.notes.join('\n')}\n\nExample (JSON strings show exact whitespace):\n${exampleText(doc.example)}\n\nReference: knap help tags | knap help syntax\n`;
	}
	throw new Error('Expected knap help syntax, filters, tags, filter <name>, or tag <name>.');
}
