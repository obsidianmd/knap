import { lstat, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import type { TemplateEngine, TemplateVariables } from '../types';
import { parseCsv } from './csv';
import { parseData, parseJson, requireObject } from './data';
import { reportDiagnostics } from './diagnostics';

interface BatchRecord {
	variables: TemplateVariables;
	filename: string;
	label: string;
}

interface BatchOptions {
	data?: string;
	dataJson?: string;
	outputDir: string;
	filename?: string;
	overwrite?: boolean;
	format?: 'csv' | 'json';
	dryRun?: boolean;
	overrides: TemplateVariables;
	template: string;
	templateLabel: string;
	engine: TemplateEngine;
	readStdin: () => Promise<string>;
}

async function readRecords(options: BatchOptions): Promise<BatchRecord[]> {
	const source = options.data ?? '--data-json';
	let text: string;
	if (options.dataJson !== undefined) text = options.dataJson;
	else if (source === '-') text = await options.readStdin();
	else if ((await stat(source)).isDirectory()) {
		if (options.format === 'csv') throw new Error('--format csv requires a file or stdin; folder input contains JSON objects.');
		const entries = (await readdir(source, { withFileTypes: true }))
			.filter(entry => entry.isFile() && extname(entry.name).toLowerCase() === '.json')
			.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
		const records: BatchRecord[] = [];
		for (const entry of entries) {
			const path = join(source, entry.name);
			records.push({
				variables: parseData(await readFile(path, 'utf8'), path),
				filename: entry.name.slice(0, -5) + '.md',
				label: path,
			});
		}
		return records;
	}
	else text = await readFile(source, 'utf8');

	const label = source === '-' ? '<stdin>' : source;
	let records: TemplateVariables[];
	if (options.format === 'csv' || (options.format === undefined && options.dataJson === undefined && extname(source).toLowerCase() === '.csv')) {
		records = parseCsv(text, label);
	}
	else {
		const data = parseJson(text, label);
		if (!Array.isArray(data)) throw new Error(`Batch data in ${label} must be a JSON array of objects.`);
		records = data.map((record, index) => requireObject(record, `${label} record ${index + 1}`));
	}
	return records.map((variables, index) => ({ variables, filename: `${index + 1}.md`, label: `${label} record ${index + 1}` }));
}

function validateFilename(filename: string, label: string, intentionalDotfile: boolean, fromTemplate: boolean): void {
	const sourceAdvice = 'Rename the source file or provide a --filename template.';
	if (/^\s/.test(filename)) {
		const advice = fromTemplate ? 'Apply the trim or safe_name filter to data values.' : sourceAdvice;
		throw new Error(`${label}: Invalid output filename ${JSON.stringify(filename)}: leading whitespace is not allowed. ${advice}`);
	}
	// Validate the rendered basename, including separators left by empty values.
	// A literal leading dot declares an intentional dotfile, rather than an extension.
	const name = intentionalDotfile && filename.startsWith('.') ? filename.slice(1) : filename;
	const extensionStart = name.lastIndexOf('.');
	const basename = extensionStart === -1 ? name : name.slice(0, extensionStart);
	if (/^[\s._-]*$/.test(basename)) {
		const advice = fromTemplate
			? 'filename template produced no name. Use a basename containing more than spaces, dots, hyphens, or underscores; provide a fallback value for missing data.'
			: `basename contains only spaces, dots, hyphens, or underscores. ${sourceAdvice}`;
		throw new Error(`${label}: Invalid output filename ${JSON.stringify(filename)}: ${advice}`);
	}
	if (!filename || filename === '.' || filename === '..'
		|| /[<>:"/\\|?*\x00-\x1f\x7f]/.test(filename) || /[. ]$/.test(filename)
		|| /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)/i.test(filename)
		|| Buffer.byteLength(filename) > 255) {
		const advice = fromTemplate ? 'Use a single filename without directories; apply the safe_name filter to data values.' : sourceAdvice;
		throw new Error(`${label}: Invalid output filename ${JSON.stringify(filename)}. ${advice}`);
	}
}

async function validateOutputDirectory(outputDir: string): Promise<void> {
	let path = resolve(outputDir);
	while (true) {
		try {
			if (!(await stat(path)).isDirectory()) throw new Error(`Output directory ${JSON.stringify(outputDir)} is not a directory.`);
			return;
		}
		catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOTDIR') {
				throw new Error(`Output directory ${JSON.stringify(outputDir)} contains a path component that is not a directory.`);
			}
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
			const parent = dirname(path);
			if (parent === path) throw error;
			path = parent;
		}
	}
}

export async function renderBatch(options: BatchOptions): Promise<void> {
	const records = await readRecords(options);
	if (!records.length) throw new Error('No records found in batch input.');
	await validateOutputDirectory(options.outputDir);
	const filenameNodes = options.filename === undefined ? [] : options.engine.parse(options.filename).ast;
	const firstOutputNode = filenameNodes.find(node => node.type !== 'set');
	const intentionalDotfile = options.filename === undefined
		|| (firstOutputNode?.type === 'text' && firstOutputNode.value.startsWith('.'));
	const outputs: { path: string; content: string }[] = [];
	const names = new Map<string, string>();
	// Prepare the entire batch before creating or overwriting any output files.
	for (const record of records) {
		const variables = { ...record.variables, ...options.overrides };
		let filename = record.filename;
		if (options.filename !== undefined) {
			const result = await options.engine.render(options.filename, { variables });
			reportDiagnostics(result, `${record.label} filename`);
			if (result.errors.length) throw new Error('Batch stopped before writing files.');
			filename = result.output;
		}
		validateFilename(filename, record.label, intentionalDotfile, options.filename !== undefined);
		// Treat case and Unicode normalization variants as collisions on all OSes.
		const key = filename.normalize('NFC').toLowerCase();
		if (names.has(key)) throw new Error(`Duplicate output filename ${JSON.stringify(filename)} from ${record.label} and ${names.get(key)}.`);
		names.set(key, record.label);
		const path = join(options.outputDir, filename);
		try {
			const existing = await lstat(path);
			if (!existing.isFile()) throw new Error(`Output ${path} is not a regular file.`);
			if (!options.overwrite) throw new Error(`Output ${path} already exists. Use --overwrite to replace existing files.`);
		}
		catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
		const result = await options.engine.render(options.template, { variables });
		reportDiagnostics(result, `${options.templateLabel} (${record.label})`);
		if (result.errors.length) throw new Error('Batch stopped before writing files.');
		outputs.push({ path, content: result.output });
	}
	if (options.dryRun) {
		process.stdout.write(outputs.map(output => output.path).join('\n') + '\n');
		process.stderr.write(`Would write ${outputs.length} ${outputs.length === 1 ? 'file' : 'files'} to ${options.outputDir}.\n`);
		return;
	}
	let written = 0;
	try {
		await mkdir(options.outputDir, { recursive: true });
		for (const output of outputs) {
			await writeFile(output.path, output.content, { encoding: 'utf8', flag: options.overwrite ? 'w' : 'wx' });
			written++;
		}
	}
	catch (error) {
		throw new Error(`Batch stopped after writing ${written} of ${outputs.length} files: ${error instanceof Error ? error.message : String(error)}`);
	}
	process.stderr.write(`Wrote ${written} ${written === 1 ? 'file' : 'files'} to ${options.outputDir}.\n`);
}
