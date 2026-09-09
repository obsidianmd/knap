import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'tsup';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { version } from '../package.json';

let directory: string;
let cli: string;

function run(args: string[], input = '') {
	const result = spawnSync(process.execPath, [cli, ...args], {
		input,
		encoding: 'utf8',
		cwd: directory,
		timeout: 10_000,
	});
	if (result.error) throw result.error;
	return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

beforeAll(async () => {
	directory = await mkdtemp(join(tmpdir(), 'knap-cli-test-'));
	await build({
		entry: [resolve('src/cli.ts')],
		outDir: directory,
		format: ['esm'],
		outExtension: () => ({ js: '.mjs' }),
		noExternal: [/.*/],
		config: false,
		silent: true,
	});
	cli = join(directory, 'cli.mjs');
	await writeFile(join(directory, 'template.md'), '# {{ title | upper }}\n{{ content }}');
	await writeFile(join(directory, 'article.json'), JSON.stringify({ title: 'Hello', content: 'Body' }));
}, 30_000);

afterAll(async () => {
	if (directory) await rm(directory, { recursive: true, force: true });
});

describe('CLI', () => {
	test.each([[], ['--help'], ['render', '-h']])('shows help for %j', (...args) => {
		const result = run(args);
		expect(result.status).toBe(0);
		expect(result.stdout).toContain('Usage: knap render');
		expect(result.stderr).toBe('');
	});

	test('reports the package version', () => {
		expect(run(['--version'])).toEqual({ status: 0, stdout: `${version}\n`, stderr: '' });
	});

	test('renders inline templates with typed JSON variables', () => {
		expect(run(['render', '-t', '{% if enabled %}{{ user.name }}: {{ items | join:", " }} ({{ count | calc:"+1" }}){% endif %}',
			'--data-json', '{"enabled":true,"user":{"name":"Hi"},"items":["a","b"],"count":2}',
		])).toEqual({ status: 0, stdout: 'Hi: a, b (3)', stderr: '' });
	});

	test('renders template and data files to stdout without adding a newline', () => {
		expect(run(['render', 'template.md', '-d', 'article.json']))
			.toEqual({ status: 0, stdout: '# HELLO\nBody', stderr: '' });
	});

	test('writes a destination file without printing rendered output', async () => {
		expect(run(['render', 'template.md', '--data', 'article.json', '-o', 'note.md']))
			.toEqual({ status: 0, stdout: '', stderr: '' });
		expect(await readFile(join(directory, 'note.md'), 'utf8')).toBe('# HELLO\nBody');
	});

	test('creates nested output directories only after rendering succeeds', async () => {
		const output = join(directory, 'nested', 'notes', 'note.md');
		expect(run(['render', '-t', 'Body', '-o', output]).status).toBe(0);
		expect(await readFile(output, 'utf8')).toBe('Body');
		const invalid = join(directory, 'invalid-render');
		expect(run(['render', '-t', '{{ title', '-o', join(invalid, 'note.md')]).status).toBe(1);
		await expect(readdir(invalid)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('labels output filesystem failures with their destination', async () => {
		const blocker = join(directory, 'output-blocker');
		await writeFile(blocker, 'Existing');
		const output = join(blocker, 'note.md');
		const result = run(['render', '-t', 'Body', '-o', output]);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(`Cannot write output ${JSON.stringify(output)}`);
		expect(await readFile(blocker, 'utf8')).toBe('Existing');
	});

	test.each([['-'], []])('reads an explicit or implicit template from stdin (%j)', (...source) => {
		expect(run(['render', ...source, '-d', 'article.json'], '{{ title }}'))
			.toEqual({ status: 0, stdout: 'Hello', stderr: '' });
	});

	test.each([['template.md'], ['-t', '# {{ title | upper }}\n{{ content }}']])('reads JSON from stdin (%j)', (...template) => {
		expect(run(['render', ...template, '--data', '-', '--output', '-'], '{"title":"Piped","content":"Article"}'))
			.toEqual({ status: 0, stdout: '# PIPED\nArticle', stderr: '' });
	});

	test('applies repeated string overrides after base data, preserving equals and empty values', () => {
		expect(run(['render', '-t', '{{ title }}|{{ flag }}|{{ empty }}|{{ query }}',
			'--set', 'title=First', '--data-json', '{"title":"Base","flag":true,"empty":"value"}',
			'--set', 'title=Last', '--set', 'flag=false', '--set', 'empty=', '--set', 'query=a=b',
		])).toEqual({ status: 0, stdout: 'Last|false||a=b', stderr: '' });
	});

	test('treats --set keys as literal top-level keys and supports spaces', () => {
		expect(run(['render', '-t', '{{ First name }}', '--set', 'First name=Ada']))
			.toEqual({ status: 0, stdout: 'Ada', stderr: '' });
	});

	test('defaults to empty variables and accepts an empty inline template', () => {
		expect(run(['render', '-t', 'Static text'])).toEqual({ status: 0, stdout: 'Static text', stderr: '' });
		expect(run(['render', '-t', ''])).toEqual({ status: 0, stdout: '', stderr: '' });
	});

	test.each([
		[['render', 'template.md', '-t', 'text'], 'Choose a template file'],
		[['render', '-t', 'text', '-d', 'article.json', '--data-json', '{}'], 'Choose --data'],
		[['render', '-', '--data', '-'], 'cannot both read stdin'],
		[['render', '--data', '-'], 'cannot both read stdin'],
		[['render', '-t', 'text', '--set', 'invalid'], 'key=value'],
		[['render', '-t', 'text', '--set', '=value'], 'nonempty key'],
		[['render', '-t', 'one', '--template', 'two'], 'may only be supplied once'],
		[['render', 'one.md', 'two.md'], 'only one template file'],
		[['unknown'], 'Expected the "render" or "batch" command'],
		[['render', '--unknown'], 'Unknown option'],
		[['render', '--template'], 'argument missing'],
	])('rejects invalid arguments %j', (args, message) => {
		const result = run(args);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain(message);
	});

	test.each(['{invalid', 'null', '[]', '"text"', '42', 'true'])('rejects invalid data %s without overwriting the destination', async data => {
		await writeFile(join(directory, 'preserved.md'), 'Existing note');
		const result = run(['render', '-t', 'text', '--data-json', data, '-o', 'preserved.md']);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain('JSON object');
		expect(await readFile(join(directory, 'preserved.md'), 'utf8')).toBe('Existing note');
	});

	test('labels malformed piped data', () => {
		const result = run(['render', '-t', 'text', '--data', '-'], '{invalid');
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Invalid JSON in stdin');
	});

	test.each(['{{ title', '{{ title | not_a_filter }}'])('reports template diagnostics without writing output (%s)', async template => {
		await writeFile(join(directory, 'preserved.md'), 'Existing note');
		const result = run(['render', '-t', template, '--output', 'preserved.md']);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toMatch(/<template>:1:\d+: error /);
		expect(await readFile(join(directory, 'preserved.md'), 'utf8')).toBe('Existing note');
	});

	test('reports warnings on stderr while emitting successful output', () => {
		const result = run(['render', '-t', '{{ published | date:"YYYY-MM-DD" }}', '--set', 'published=not-a-date']);
		expect(result.status).toBe(0);
		expect(result.stdout).toBe('not-a-date');
		expect(result.stderr).toMatch(/<template>:1:\d+: warning INVALID_FILTER_INPUT \(date\):/);
	});

	test.each([
		['render', 'missing-template.md'],
		['render', '-t', 'text', '--data', 'missing-data.json'],
	])('reports filesystem failures (%j)', (...args) => {
		const result = run(args);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain('ENOENT');
		expect(result.stderr).not.toContain('at main');
	});
});

describe('batch CLI', () => {
	async function fixture() {
		const root = await mkdtemp(join(directory, 'batch-'));
		return { root, output: join(root, 'notes') };
	}

	test('reads piped CSV with an explicit format and preserves CSV string values', async () => {
		const { output } = await fixture();
		const result = run(['batch', '-t', '{{ title }}|{{ id }}', '--data', '-', '--format', 'csv', '--output-dir', output], '\uFEFFtitle,id\n"One, two",00123\n');
		expect(result.status).toBe(0);
		expect(await readFile(join(output, '1.md'), 'utf8')).toBe('One, two|00123');
	});

	test.each([['csv', 'export', 'title\nHello\n'], ['json', 'data.csv', '[{"title":"Hello"}]']] as const)('uses explicit %s over the filename extension', async (format, name, data) => {
		const { root, output } = await fixture();
		const input = join(root, name);
		await writeFile(input, data);
		expect(run(['batch', '-t', '{{ title }}', '--data', input, '--format', format, '--output-dir', output]).status).toBe(0);
		expect(await readFile(join(output, '1.md'), 'utf8')).toBe('Hello');
	});

	test('rejects CSV format for JSON-only sources', async () => {
		const { root, output } = await fixture();
		for (const data of [['--data', root], ['--data-json', '[{}]']]) {
			const result = run(['batch', '-t', 'Body', ...data, '--format', 'csv', '--output-dir', output]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('JSON');
		}
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('lists a fully validated dry run without creating any directories', async () => {
		const { root } = await fixture();
		const output = join(root, 'new', 'notes');
		const result = run(['batch', '-t', '{{ title }}', '--data-json', '[{"title":"One"},{"title":"Two"}]', '--output-dir', output, '--filename', '{{ title }}.md', '--dry-run']);
		expect(result.status).toBe(0);
		expect(result.stdout).toBe(`${join(output, 'One.md')}\n${join(output, 'Two.md')}\n`);
		expect(result.stderr).toContain('Would write 2 files');
		await expect(readdir(join(root, 'new'))).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('dry runs enforce overwrite rules without changing existing files', async () => {
		const { output } = await fixture();
		await mkdir(output);
		const path = join(output, '1.md');
		await writeFile(path, 'Original');
		const args = ['batch', '-t', 'Replacement', '--data-json', '[{}]', '--output-dir', output, '--dry-run'];
		expect(run(args).status).toBe(1);
		const result = run([...args, '--overwrite']);
		expect(result.status).toBe(0);
		expect(result.stdout).toBe(`${path}\n`);
		expect(await readFile(path, 'utf8')).toBe('Original');
	});

	test.each([
		['--filename', 'same.md'],
		['--filename', '../escape.md'],
		['--filename', '{{ missing }}.md'],
		['-t', '{{ title | nonexistent }}'],
	])('dry runs report validation errors without listing partial plans (%j)', async (option, value) => {
		const { output } = await fixture();
		const result = run(['batch', ...(option === '-t' ? [] : ['-t', 'Body']), '--data-json', '[{},{}]', '--output-dir', output, '--dry-run', option, value]);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('dry runs reject non-directory destinations and symlink outputs', async () => {
		const { root, output } = await fixture();
		const target = join(root, 'existing');
		await writeFile(target, 'Original');
		const args = ['batch', '-t', 'Body', '--data-json', '[{}]', '--dry-run', '--overwrite'];
		expect(run([...args, '--output-dir', target]).status).toBe(1);
		const nested = run([...args, '--output-dir', join(target, 'nested')]);
		expect(nested.status).toBe(1);
		expect(nested.stderr).toContain('contains a path component that is not a directory');
		expect(nested.stderr).not.toContain('ENOTDIR');
		await mkdir(output);
		await symlink(target, join(output, '1.md'));
		expect(run([...args, '--output-dir', output]).status).toBe(1);
		expect(await readFile(target, 'utf8')).toBe('Original');
	});

	test.each(['{{ missing }}.md', '{{ a }}-{{ b }}.md', '{{ a }}_{{ b }}.md', '{% if title %}{{ title }}.md{% else %}-.md{% endif %}', '{{ title | trim }}.txt', '{% if title %}{{ title }}{% endif %}.md'])('rejects an empty generated basename (%s) before creating output', async filename => {
		const { output } = await fixture();
		const result = run(['batch', '-t', 'Body', '--data-json', '[{"title":""},{}]', '--output-dir', output, '--filename', filename]);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('filename template produced no name');
		expect(result.stderr).not.toContain('Duplicate');
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test.each(['   ', ' note', '\u00a0note'])('rejects leading whitespace without silently changing filenames (%j)', async title => {
		const { output } = await fixture();
		for (const extra of [[], ['--dry-run']]) {
			const result = run(['batch', '-t', 'Body', '--data-json', JSON.stringify([{ title }]), '--output-dir', output, '--filename', '{{ title }}.md', ...extra]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('leading whitespace is not allowed');
			expect(result.stdout).toBe('');
		}
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test.each([
		['{{ title }}{{ suffix }}.md', 'Hello.md'],
		['note-{{ missing }}.md', 'note-.md'],
		['{{ missing ?? "Untitled" }}.md', 'Untitled.md'],
		['.{{ title }}', '.Hello'],
		['.env', '.env'],
		['{% set name = "env" %}.{{ name }}', '.env'],
		['{{ title }}{% if suffix %}-{{ suffix }}{% endif %}.md', 'Hello.md'],
	])('preserves valid names with optional values, fallbacks, or explicit dots (%s)', async (filename, expected) => {
		const { output } = await fixture();
		expect(run(['batch', '-t', 'Body', '--data-json', '[{"title":"Hello"}]', '--output-dir', output, '--filename', filename]).status).toBe(0);
		expect(await readdir(output)).toEqual([expected]);
	});

	test.each(['.env', '.{{ title }}', '{{ title }}.md'])('allows intentional dotfiles and nonempty generated names (%s)', async filename => {
		const { output } = await fixture();
		const result = run(['batch', '-t', 'Body', '--data-json', '[{"title":"note"}]', '--output-dir', output, '--filename', filename]);
		expect(result.status).toBe(0);
		expect((await readdir(output)).length).toBe(1);
	});

	test('renders a CSV file with quoted fields and string identifiers into named files', async () => {
		const { root, output } = await fixture();
		const input = join(root, 'articles.csv');
		await writeFile(input, '\uFEFFtitle,id,content\r\n"One, two",00123,"Line one\nLine ""two"""\r\nOther,00002,Body\r\n');
		const result = run(['batch', '-t', '{{ id }}\n{{ content }}', '--data', input, '--output-dir', output,
			'--filename', '{{ title | safe_name }}.md']);
		expect(result.status).toBe(0);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain('Wrote 2 files');
		expect(await readdir(output)).toEqual(['One, two.md', 'Other.md']);
		expect(await readFile(join(output, 'One, two.md'), 'utf8')).toBe('00123\nLine one\nLine "two"');
	});

	test('renders typed JSON array data and applies overrides to every record', async () => {
		const { root, output } = await fixture();
		const input = join(root, 'articles.json');
		await writeFile(input, JSON.stringify([{ user: { name: 'Ada' }, tags: ['a', 'b'], enabled: true }, { user: { name: 'Grace' }, tags: [], enabled: false }]));
		expect(run(['batch', '-t', '{{ user.name }}|{{ tags | join:"," }}|{% if enabled %}yes{% else %}no{% endif %}|{{ category }}',
			'--data', input, '--output-dir', output, '--set', 'category=Notes']).status).toBe(0);
		expect(await readFile(join(output, '1.md'), 'utf8')).toBe('Ada|a,b|yes|Notes');
		expect(await readFile(join(output, '2.md'), 'utf8')).toBe('Grace||no|Notes');
	});

	test.each([' lead.json', '-.json', 'CON.json'])('gives source-file advice for invalid default folder filenames (%s)', async name => {
		const { root, output } = await fixture();
		await writeFile(join(root, name), '{"title":"Note"}');
		const args = ['batch', '-t', 'Body', '--data', root, '--output-dir', output];
		const result = run(args);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Rename the source file or provide a --filename template.');
		expect(result.stderr).not.toContain('filter to data values');
		expect(result.stderr).not.toContain('filename template produced no name');
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
		expect(run([...args, '--filename', '{{ title }}.md']).status).toBe(0);
		expect(await readdir(output)).toEqual(['Note.md']);
	});

	test('renders a JSON folder non-recursively and preserves source basenames', async () => {
		const { root, output } = await fixture();
		const input = join(root, 'data');
		await mkdir(join(input, 'nested'), { recursive: true });
		await writeFile(join(input, 'b.JSON'), '{"title":"Second"}');
		await writeFile(join(input, 'a.json'), '{"title":"First"}');
		await writeFile(join(input, 'ignored.txt'), 'Not JSON');
		await writeFile(join(input, 'nested', 'ignored.json'), 'Not JSON');
		await symlink(join(input, 'a.json'), join(input, 'link.json'));
		expect(run(['batch', 'template.md', '--data', input, '--output-dir', output]).status).toBe(0);
		expect(await readdir(output)).toEqual(['a.md', 'b.md']);
		expect(await readFile(join(output, 'a.md'), 'utf8')).toBe('# FIRST\n');
	});

	test('accepts an inline JSON array and filenames based on filters', async () => {
		const { output } = await fixture();
		expect(run(['batch', '-t', '{{ title }}', '--data-json', '[{"title":"A/B","published":"2026-09-08"}]',
			'--output-dir', output, '--filename', '{{ published | date:"YYYY-MM-DD" }}-{{ title | safe_name }}.md']).status).toBe(0);
		expect(await readFile(join(output, '2026-09-08-AB.md'), 'utf8')).toBe('A/B');
	});

	test('reads a JSON array from stdin', async () => {
		const { output } = await fixture();
		expect(run(['batch', '-t', '{{ title }}', '--data', '-', '--output-dir', output], '[{"title":"Piped"}]').status).toBe(0);
		expect(await readFile(join(output, '1.md'), 'utf8')).toBe('Piped');
	});

	test('reads the template from stdin with inline batch data', async () => {
		const { output } = await fixture();
		expect(run(['batch', '--data-json', '[{"title":"Piped"}]', '--output-dir', output], '{{ title }}').status).toBe(0);
		expect(await readFile(join(output, '1.md'), 'utf8')).toBe('Piped');
	});

	test('numbers CSV outputs by record, ignoring blank lines', async () => {
		const { root, output } = await fixture();
		await writeFile(join(root, 'data.csv'), 'title\n\nFirst\n\nSecond\n');
		expect(run(['batch', '-t', '{{ title }}', '-d', join(root, 'data.csv'), '--output-dir', output]).status).toBe(0);
		expect(await readdir(output)).toEqual(['1.md', '2.md']);
	});

	test('refuses existing outputs before writing any files, and supports explicit overwrite', async () => {
		const { output } = await fixture();
		await mkdir(output);
		await writeFile(join(output, '2.md'), 'Existing');
		const args = ['batch', '-t', '{{ title }}', '--data-json', '[{"title":"First"},{"title":"Second"}]', '--output-dir', output];
		const failure = run(args);
		expect(failure.status).toBe(1);
		expect(failure.stderr).toContain('--overwrite');
		expect(await readdir(output)).toEqual(['2.md']);
		expect(await readFile(join(output, '2.md'), 'utf8')).toBe('Existing');
		expect(run([...args, '--overwrite']).status).toBe(0);
		expect(await readFile(join(output, '2.md'), 'utf8')).toBe('Second');
	});

	test.each([
		['Same', 'Same'], ['Same', 'same'], ['Café', 'Cafe\u0301'],
	])('rejects duplicate filenames even with --overwrite (%s, %s)', async (first, second) => {
		const { output } = await fixture();
		const result = run(['batch', '-t', '{{ title }}', '--data-json', JSON.stringify([{ title: first }, { title: second }]),
			'--output-dir', output, '--filename', '{{ title }}.md', '--overwrite']);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Duplicate output filename');
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test.each(['../escape.md', '/absolute.md', 'nested/note.md', 'nested\\note.md', '', '..', 'note.', 'note ', 'CON.md', 'a'.repeat(256)])('rejects invalid filenames (%s)', async filename => {
		const { output } = await fixture();
		const result = run(['batch', '-t', 'Body', '--data-json', '[{}]', '--output-dir', output, '--filename', filename]);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Invalid output filename');
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('refuses symlink outputs even with overwrite', async () => {
		const { root, output } = await fixture();
		await mkdir(output);
		const target = join(root, 'existing.md');
		await writeFile(target, 'Existing');
		await symlink(target, join(output, '1.md'));
		const result = run(['batch', '-t', 'Changed', '--data-json', '[{}]', '--output-dir', output, '--overwrite']);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('not a regular file');
		expect(await readFile(target, 'utf8')).toBe('Existing');
	});

	test.each(['{{ title', '{{ title | nonexistent }}'])('does not write output when the content or filename template is invalid (%s)', async template => {
		for (const filename of [false, true]) {
			const { output } = await fixture();
			const result = run(['batch', '-t', filename ? 'Body' : template, '--data-json', '[{}]', '--output-dir', output,
				...(filename ? ['--filename', template] : [])]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain('record 1');
			expect(result.stderr).toContain('before writing files');
			await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
		}
	});

	test('reports per-record warnings and continues rendering', async () => {
		const { output } = await fixture();
		const result = run(['batch', '-t', '{{ date | date:"YYYY-MM-DD" }}', '--data-json', '[{"date":"not-a-date"}]', '--output-dir', output]);
		expect(result.status).toBe(0);
		expect(result.stderr).toContain('record 1');
		expect(result.stderr).toContain('warning INVALID_FILTER_INPUT');
		expect(await readFile(join(output, '1.md'), 'utf8')).toBe('not-a-date');
	});

	test.each(['[]', '{}', '[{},null]', '[{},[]]', '[{},42]', '{invalid'])('rejects empty or invalid batch data (%s)', async data => {
		const { output } = await fixture();
		expect(run(['batch', '-t', 'Body', '--data-json', data, '--output-dir', output]).status).toBe(1);
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test('does not write any files when a later JSON file is malformed', async () => {
		const { root, output } = await fixture();
		await writeFile(join(root, 'a.json'), '{}');
		await writeFile(join(root, 'b.json'), '{invalid');
		const result = run(['batch', '-t', 'Body', '--data', root, '--output-dir', output]);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain('b.json');
		await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
	});

	test.each([
		[['batch', '-t', 'Body', '--data-json', '[{}]'], 'requires --output-dir'],
		[['batch', '-t', 'Body', '--output-dir', 'out'], 'requires --data'],
		[['batch', '-t', 'Body', '--output', 'note.md'], 'Use --output-dir'],
		[['render', '-t', 'Body', '--filename', 'name.md'], 'only available with batch'],
		[['render', '-t', 'Body', '--overwrite'], 'only available with batch'],
		[['render', '-t', 'Body', '--dry-run'], 'only available with batch'],
		[['render', '-t', 'Body', '--format', 'csv'], 'only available with batch'],
		[['batch', '-t', 'Body', '--data-json', '[{}]', '--output-dir', 'out', '--format', 'tsv'], '--format must be'],
		[['batch', '--data', '-', '--output-dir', 'out'], 'cannot both read stdin'],
	])('rejects incompatible arguments (%j)', (args, message) => {
		const result = run(args);
		expect(result.status).toBe(1);
		expect(result.stderr).toContain(message);
	});
});
