#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { version } from '../package.json';
import { createEngine, standardFilters, type TemplateVariables } from './index';

const help = `Usage: knap render [template-file] [options]

Render a Knap template using JSON variables and standard filters.

Arguments:
  template-file          Template file, or "-" for stdin. If omitted, read
                         piped stdin unless --template supplies the template.

Options:
  -t, --template <text>  Inline template (instead of a template file)
  -d, --data <file>      JSON variables file, or "-" for stdin
      --data-json <json> Inline JSON variables object (instead of --data)
      --set <key=value>  Override a top-level variable with a string; repeatable
  -o, --output <file>    Output file, or "-" for stdout (default: stdout)
  -h, --help             Show help
  -v, --version          Show version

Examples:
  knap render template.md --data article.json -o note.md
  knap render -t '# {{ title }}' --set title=Hello
  cat article.json | knap render template.md --data -
  cat template.md | knap render --data article.json

Only one input may use stdin. Data must be a JSON object; defaults to {}.
Diagnostics go to stderr. Rendering errors exit with status 1 without writing
output. Warnings do not prevent output. Rendered text is written unchanged.
`;

async function readStdin(): Promise<string> {
	if (process.stdin.isTTY) {
		throw new Error('No piped input. Pass a template file, use --template, or pipe input to stdin.');
	}
	process.stdin.setEncoding('utf8');
	let input = '';
	for await (const chunk of process.stdin) input += chunk;
	return input;
}

function parseData(text: string, source: string): TemplateVariables {
	let data: unknown;
	try {
		data = JSON.parse(text);
	}
	catch {
		throw new Error(`Invalid JSON in ${source}. Expected a JSON object containing template variables.`);
	}
	if (data === null || typeof data !== 'object' || Array.isArray(data)) {
		throw new Error(`Data in ${source} must be a JSON object containing template variables.`);
	}
	return data as TemplateVariables;
}

async function main(): Promise<void> {
	const { values, positionals, tokens } = parseArgs({
		allowPositionals: true,
		tokens: true,
		options: {
			template: { type: 'string', short: 't' },
			data: { type: 'string', short: 'd' },
			'data-json': { type: 'string' },
			set: { type: 'string', multiple: true },
			output: { type: 'string', short: 'o' },
			help: { type: 'boolean', short: 'h' },
			version: { type: 'boolean', short: 'v' },
		},
	});

	if (values.help || process.argv.length === 2) {
		process.stdout.write(help);
		return;
	}
	if (values.version) {
		process.stdout.write(`${version}\n`);
		return;
	}
	if (positionals[0] !== 'render') {
		throw new Error('Expected the "render" command. Run knap --help for usage.');
	}
	if (positionals.length > 2) {
		throw new Error('Expected only one template file.');
	}
	const seen = new Set<string>();
	for (const token of tokens) {
		if (token.kind !== 'option' || token.name === 'set') continue;
		if (seen.has(token.name)) throw new Error(`Option --${token.name} may only be supplied once.`);
		seen.add(token.name);
	}
	const source = positionals[1];
	if (source !== undefined && values.template !== undefined) {
		throw new Error('Choose a template file or --template, not both.');
	}
	if (values.data !== undefined && values['data-json'] !== undefined) {
		throw new Error('Choose --data or --data-json, not both.');
	}
	const templateFromStdin = values.template === undefined && (source === undefined || source === '-');
	if (templateFromStdin && values.data === '-') {
		throw new Error('Template and data cannot both read stdin. Supply a template file or --template with --data -.');
	}

	const overrides: Record<string, string> = Object.create(null);
	for (const assignment of values.set ?? []) {
		const separator = assignment.indexOf('=');
		if (separator < 1) throw new Error('--set requires key=value with a nonempty key.');
		overrides[assignment.slice(0, separator)] = assignment.slice(separator + 1);
	}

	const template = values.template ?? (templateFromStdin
		? await readStdin()
		: await readFile(source!, 'utf8'));
	let variables: TemplateVariables = {};
	if (values.data !== undefined) {
		const data = values.data === '-' ? await readStdin() : await readFile(values.data, 'utf8');
		variables = parseData(data, values.data === '-' ? 'stdin' : values.data);
	}
	else if (values['data-json'] !== undefined) {
		variables = parseData(values['data-json'], '--data-json');
	}
	variables = { ...variables, ...overrides };

	const engine = createEngine({ filters: standardFilters });
	const result = await engine.render(template, { variables });
	const label = templateFromStdin ? '<stdin>' : source ?? '<template>';
	for (const warning of result.warnings) {
		process.stderr.write(`${label}:${warning.line}:${warning.column}: warning ${warning.code} (${warning.filter}): ${warning.message}\n`);
	}
	for (const error of result.errors) {
		process.stderr.write(`${label}:${error.line}:${error.column}: error ${error.code}: ${error.message}\n`);
	}
	if (result.errors.length) {
		process.exitCode = 1;
		return;
	}
	if (values.output !== undefined && values.output !== '-') {
		await writeFile(values.output, result.output, 'utf8');
	}
	else {
		process.stdout.write(result.output);
	}
}

process.stdout.on('error', (error: NodeJS.ErrnoException) => {
	// A downstream command such as head may finish before consuming all output.
	if (error.code !== 'EPIPE') {
		process.stderr.write(`knap: ${error.message}\n`);
		process.exitCode = 1;
	}
});

main().catch((error: unknown) => {
	process.stderr.write(`knap: ${error instanceof Error ? error.message : String(error)}\n`);
	process.exitCode = 1;
});
