#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { version } from '../package.json';
import { createEngine, standardFilters, type TemplateVariables } from './index';
import { renderBatch } from './cli/batch';
import { parseData } from './cli/data';
import { reportDiagnostics } from './cli/diagnostics';
import { help, topicHelp, validationHelp } from './cli/help';

async function readStdin(): Promise<string> {
	if (process.stdin.isTTY) {
		throw new Error('No piped input. Pass a template file, use --template, or pipe input to stdin.');
	}
	process.stdin.setEncoding('utf8');
	let input = '';
	for await (const chunk of process.stdin) input += chunk;
	return input;
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
			'output-dir': { type: 'string' },
			filename: { type: 'string' },
			overwrite: { type: 'boolean' },
			format: { type: 'string' },
			'dry-run': { type: 'boolean' },
			help: { type: 'boolean', short: 'h' },
			version: { type: 'boolean', short: 'v' },
		},
	});

	if (values.help || process.argv.length === 2) {
		process.stdout.write(positionals[0] === 'validate' ? validationHelp : help);
		return;
	}
	if (values.version) {
		process.stdout.write(`${version}\n`);
		return;
	}
	if (positionals[0] === 'help') {
		if (Object.keys(values).length > 0) throw new Error('The help command does not accept rendering options. Run knap help for usage.');
		process.stdout.write(topicHelp(positionals.slice(1)));
		return;
	}
	const validate = positionals[0] === 'validate';
	const batch = positionals[0] === 'batch';
	if (positionals[0] !== 'render' && !batch && !validate) {
		throw new Error('Expected "render", "batch", "validate", or "help". Run knap --help for usage.');
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
	if (validate) {
		for (const name of Object.keys(values)) {
			if (name !== 'template') throw new Error(`Option --${name} is not supported by validate. Run knap validate --help for usage.`);
		}
	}
	if (batch) {
		if (values.output !== undefined) throw new Error('Use --output-dir with batch, not --output.');
		if (!values['output-dir']) throw new Error('Batch requires --output-dir.');
		if (values.data === undefined && values['data-json'] === undefined) throw new Error('Batch requires --data or --data-json.');
		if (values.format !== undefined && values.format !== 'csv' && values.format !== 'json') throw new Error('--format must be csv or json.');
		if (values.format === 'csv' && values['data-json'] !== undefined) throw new Error('--data-json requires JSON; use --data with --format csv.');
	}
	else if (values['output-dir'] !== undefined || values.filename !== undefined || values.overwrite !== undefined || values.format !== undefined || values['dry-run'] !== undefined) {
		throw new Error('--output-dir, --filename, --overwrite, --format, and --dry-run are only available with batch.');
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
	const engine = createEngine({ filters: standardFilters });
	const label = templateFromStdin ? '<stdin>' : source ?? '<template>';
	if (validate) {
		const errors = engine.validate(template);
		reportDiagnostics({ errors, warnings: [] }, label);
		if (errors.length) process.exitCode = 1;
		else process.stderr.write(`${label}: Template is valid (static checks only; runtime values are not checked).\n`);
		return;
	}
	if (batch) {
		await renderBatch({
			data: values.data,
			dataJson: values['data-json'],
			outputDir: values['output-dir']!,
			filename: values.filename,
			overwrite: values.overwrite,
			format: values.format as 'csv' | 'json' | undefined,
			dryRun: values['dry-run'],
			overrides,
			template,
			templateLabel: label,
			engine,
			readStdin,
		});
		return;
	}
	let variables: TemplateVariables = {};
	if (values.data !== undefined) {
		const data = values.data === '-' ? await readStdin() : await readFile(values.data, 'utf8');
		variables = parseData(data, values.data === '-' ? 'stdin' : values.data);
	}
	else if (values['data-json'] !== undefined) {
		variables = parseData(values['data-json'], '--data-json');
	}
	variables = { ...variables, ...overrides };

	const result = await engine.render(template, { variables });
	reportDiagnostics(result, label);
	if (result.errors.length) {
		process.exitCode = 1;
		return;
	}
	if (values.output !== undefined && values.output !== '-') {
		try {
			await mkdir(dirname(values.output), { recursive: true });
			await writeFile(values.output, result.output, 'utf8');
		}
		catch (error) {
			throw new Error(`Cannot write output ${JSON.stringify(values.output)}: ${error instanceof Error ? error.message : String(error)}`);
		}
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
