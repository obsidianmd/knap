import { describe, expect, test, vi } from 'vitest';
import { createEngine } from '../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../src/filters';
import { decode_uri } from '../src/filters/decode_uri';
import { table } from '../src/filters/table';
import { wikilink } from '../src/filters/wikilink';

const engine = createEngine({ filters: standardFilters });

describe('existing filter compatibility with main', () => {
	test('keeps table output for representative inputs', () => {
		expect(table('[{"name":"Ada","age":30}]')).toBe([
			'| name | age |',
			'| - | - |',
			'| Ada | 30 |',
		].join('\n'));
		expect(table('{"name":"Ada","age":30}')).toBe([
			'| name | Ada |',
			'| - | - |',
			'| age | 30 |',
		].join('\n'));
		expect(table('["Ada",30]', '("Name", "Age")')).toBe([
			'| Name | Age |',
			'| - | - |',
			'| Ada | 30 |',
		].join('\n'));
	});

	test('keeps scalar decode_uri behavior', () => {
		expect(decode_uri('hello%20world')).toBe('hello world');
		expect(decode_uri('%ZZ')).toBe('%ZZ');
	});

	test('keeps wikilink output for strings and collections', () => {
		expect(wikilink('page')).toBe('[[page]]');
		expect(wikilink('page', 'alias')).toBe('[[page|alias]]');
		expect(wikilink('["one","two"]')).toBe('["[[one]]","[[two]]"]');
		expect(wikilink('{"one":"First"}')).toBe('["[[one|First]]"]');
	});

	test('keeps full-render output and clean error/warning results', async () => {
		const result = await engine.render([
			'{{ rows | table }}',
			'{{ encoded | decode_uri }}',
			'{{ page | wikilink:"Alias" }}',
		].join('\n'), {
			variables: {
				rows: [{ name: 'Ada', age: 30 }],
				encoded: 'hello%20world',
				page: 'Home',
			},
		});
		expect(result).toEqual({
			output: '| name | age |\n| - | - |\n| Ada | 30 |\nhello world\n[[Home|Alias]]',
			errors: [],
			warnings: [],
		});
	});

	test('keeps representative output through the synchronous helper', () => {
		expect(applyFiltersWithRegistry(
			[{ name: 'Ada', age: 30 }],
			'table',
			standardFilters,
			{ variables: {} },
		)).toBe('| name | age |\n| - | - |\n| Ada | 30 |');
		expect(applyFiltersWithRegistry(
			'hello%20world',
			'decode_uri',
			standardFilters,
			{ variables: {} },
		)).toBe('hello world');
		expect(applyFiltersWithRegistry(
			'Home',
			'wikilink:"Alias"',
			standardFilters,
			{ variables: {} },
		)).toBe('[[Home|Alias]]');
	});

	test('keeps warnings for malformed table input through both paths', async () => {
		const rendered = await engine.render('{{ value | table }}', {
			variables: { value: '[invalid' },
		});
		expect(rendered.output).toBe('[invalid');
		expect(rendered.errors).toEqual([]);
		expect(rendered.warnings).toMatchObject([{
			code: 'INVALID_FILTER_INPUT',
			filter: 'table',
		}]);

		const reportWarning = vi.fn();
		expect(applyFiltersWithRegistry(
			'[invalid',
			'table',
			standardFilters,
			{ variables: {}, reportWarning },
		)).toBe('[invalid');
		expect(reportWarning).toHaveBeenCalledWith(expect.objectContaining({
			code: 'INVALID_FILTER_INPUT',
		}));
	});

	test('approves intentional branch differences explicitly', async () => {
		// Main blanked 0/false and truncated rows wider than custom headers.
		expect(table('[{"count":0,"enabled":false}]')).toContain('| 0 | false |');
		expect(table('[["Ada",30,"Admin"]]', '("Name", "Age")')).toContain('| Ada | 30 | Admin |');

		// Main decoded only scalar strings; collection recursion is additive.
		await expect(engine.renderOrThrow('{{ value | decode_uri }}', {
			variables: { value: ['hello%20world', { path: 'a%2Fb' }] },
		})).resolves.toBe('["hello world",{"path":"a/b"}]');
	});

	test('keeps the custom-filter string API while exposing typed rawValue', async () => {
		// rawValue is the branch's intentional additive context field; value and param
		// retain the same strings delivered on main.
		const inspect = vi.fn((value: string, param?: string, context?: { rawValue?: unknown }) =>
			JSON.stringify({ value, param, rawValue: context?.rawValue }));
		const customEngine = createEngine({ filters: { inspect } });
		await expect(customEngine.renderOrThrow('{{ value | inspect:"x,y" }}', {
			variables: { value: ['a', 'b'] },
		})).resolves.toBe('{"value":"[\\"a\\",\\"b\\"]","param":"\\"x,y\\"","rawValue":["a","b"]}');
	});

	test('exposes typed arguments without changing custom-filter parameter strings', async () => {
		const inspect = (value: string, param?: string, context?: { rawArguments?: unknown[] }) =>
			JSON.stringify({ value, param, rawArguments: context?.rawArguments });
		const customEngine = createEngine({ filters: { inspect } });
		await expect(customEngine.renderOrThrow('{{ value | inspect:("1", 1, true, null) }}', {
			variables: { value: 'x' },
		})).resolves.toBe('{"value":"x","param":"1,1,true,null","rawArguments":["1",1,true,null]}');

		expect(applyFiltersWithRegistry(
			'x',
			'inspect:("1",1,true,null)',
			{ inspect },
			{ variables: {} },
		)).toBe('{"value":"x","param":"(\\"1\\",1,true,null)","rawArguments":["1",1,true,null]}');
	});

	test.each([
		{ arguments: `('"Ada"')`, param: '"Ada"', decoded: '"Ada"' },
		{ arguments: `'"Ada"'`, param: '""Ada""', decoded: '"Ada"' },
		{ arguments: String.raw`("\\\\server\\share")`, param: String.raw`"\\server\share"`, decoded: String.raw`\\server\share` },
		{ arguments: String.raw`"\\\\server\\share"`, param: String.raw`"\\server\share"`, decoded: String.raw`\\server\share` },
	])('preserves custom-filter strings for $arguments', async ({ arguments: parameters, param, decoded }) => {
		const inspect = vi.fn(() => '');
		const customEngine = createEngine({ filters: { inspect } });
		await customEngine.renderOrThrow(`{{ value | inspect:${parameters} }}`, {
			variables: { value: 'x' },
		});
		expect(inspect).toHaveBeenLastCalledWith('x', param, expect.objectContaining({
			rawArguments: [decoded],
		}));

		applyFiltersWithRegistry('x', `inspect:${parameters}`, { inspect }, { variables: {} });
		expect(inspect).toHaveBeenLastCalledWith('x', parameters, expect.objectContaining({
			rawArguments: [decoded],
		}));
	});

	test('preserves legacy colon pairs in typed arguments through both execution paths', async () => {
		const inspect = vi.fn(() => '');
		const customEngine = createEngine({ filters: { inspect } });
		await customEngine.renderOrThrow('{{ value | inspect:"a":"b" }}', {
			variables: { value: 'x' },
		});
		expect(inspect).toHaveBeenLastCalledWith('x', '"a":"b"', expect.objectContaining({
			rawArguments: ['"a":"b"'],
		}));

		applyFiltersWithRegistry('x', 'inspect:"a":"b"', { inspect }, { variables: {} });
		expect(inspect).toHaveBeenLastCalledWith('x', '"a":"b"', expect.objectContaining({
			rawArguments: ['"a":"b"'],
		}));
	});
});
