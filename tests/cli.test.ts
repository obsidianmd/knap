import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
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
		[['unknown'], 'Expected the "render" command'],
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
		['render', '-t', 'text', '--output', 'missing-directory/note.md'],
	])('reports filesystem failures (%j)', (...args) => {
		const result = run(args);
		expect(result.status).toBe(1);
		expect(result.stdout).toBe('');
		expect(result.stderr).toContain('ENOENT');
		expect(result.stderr).not.toContain('at main');
	});
});
