import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../../src/filters';
import { yaml } from '../../src/filters/yaml';

describe('yaml filter', () => {
	test.each([
		['42', '42'],
		['-12.5', '-12.5'],
		['true', 'true'],
		['FALSE', 'FALSE'],
		['null', 'null'],
	])('preserves the canonical scalar %j', (input, expected) => {
		expect(yaml(input)).toBe(expected);
	});

	test.each([
		['Ready', '"Ready"'],
		['A: value #1', '"A: value #1"'],
		['', '""'],
		[' ', '" "'],
		['007', '"007"'],
		['0x1F', '"0x1F"'],
		['1e5', '"1e5"'],
		['1.0', '"1.0"'],
		['line one\nline two', '"line one\\nline two"'],
	])('quotes the string %j', (input, expected) => {
		expect(yaml(input)).toBe(expected);
	});

	test('is available through the standard engine preset', async () => {
		const engine = createEngine({ filters: standardFilters });
		const result = await engine.render(
			'Name: {{name | yaml}}\nCount: {{count | yaml}}\nZip: {{zip | yaml}}',
			{ variables: { name: 'A: value #1', count: '42', zip: '007' } },
		);

		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('Name: "A: value #1"\nCount: 42\nZip: "007"');
	});

	test('uses block lists and mappings by default, including nested and empty collections', () => {
		const input = {
			year: 1999,
			genre: ['Action', 'Sci-fi'],
			details: { released: true, rating: null },
			people: [{ name: 'Lana', roles: ['director', 'writer'] }],
			matrix: [[1, 2], [3]],
			emptyList: [],
			emptyObject: {},
		};
		expect(yaml(JSON.stringify(input))).toBe([
			'year: 1999',
			'genre:',
			'  - "Action"',
			'  - "Sci-fi"',
			'details:',
			'  released: true',
			'  rating: null',
			'people:',
			'  - name: "Lana"',
			'    roles:',
			'      - "director"',
			'      - "writer"',
			'matrix:',
			'  - - 1',
			'    - 2',
			'  - - 3',
			'emptyList: []',
			'emptyObject: {}',
		].join('\n'));
		expect(yaml('[]')).toBe('[]');
		expect(yaml('{}')).toBe('{}');
	});

	test('preserves scalar types within collections and quotes ambiguous keys', () => {
		const input = {
			values: ['true', true, '42', 42, 'null', null, '', '2026-09-06', '[[Lana Wachowski]]'],
			'true': 'yes',
			'007': 'zip',
			'<<': 'merge',
			'A: #1': 'quoted "text"\nnext line',
		};
		expect(yaml(JSON.stringify(input))).toBe([
			'values:',
			'  - "true"', '  - true', '  - "42"', '  - 42', '  - "null"', '  - null',
			'  - ""', '  - "2026-09-06"', '  - "[[Lana Wachowski]]"',
			'"true": "yes"', '"007": "zip"', '"<<": "merge"',
			'"A: #1": "quoted \\"text\\"\\nnext line"',
		].join('\n'));
	});

	test('escapes Unicode line breaks and control characters in both styles', () => {
		const value = ['one\u0085two\u2028three\u2029four\u007f'];
		expect(yaml(JSON.stringify(value))).toBe('- "one\\u0085two\\u2028three\\u2029four\\u007f"');
		expect(yaml(JSON.stringify(value), 'flow')).toBe('["one\\u0085two\\u2028three\\u2029four\\u007f"]');
	});

	test.each(['flow', '"flow"', '("flow")'])('supports compact flow collections with %s', async param => {
		const engine = createEngine({ filters: standardFilters });
		const value = { genre: ['Action', 'Sci-fi'], details: { year: 1999 }, empty: [] };
		await expect(engine.renderOrThrow(`{{ value | yaml:${param} }}`, { variables: { value } }))
			.resolves.toBe(JSON.stringify(value));
		expect(yaml('Ready', param)).toBe('"Ready"');
	});

	test('recognizes serialized collections and preserves malformed collection text as a scalar', () => {
		expect(yaml(' \n ["Action", "Sci-fi"] ')).toBe('- "Action"\n- "Sci-fi"');
		expect(yaml('[not JSON]')).toBe('"[not JSON]"');
	});

	test('preserves collections containing non-finite parsed numbers as scalar text', async () => {
		const value = '{"count":1e400}';
		expect(yaml(value)).toBe('"{\\"count\\":1e400}"');
		expect(yaml(value, 'flow')).toBe('"{\\"count\\":1e400}"');

		const engine = createEngine({ filters: standardFilters });
		const result = await engine.render('{{ value | yaml }}', { variables: { value } });
		expect(result.output).toBe('"{\\"count\\":1e400}"');
		expect(result.errors).toEqual([]);
		expect(result.warnings).toMatchObject([{
			code: 'INVALID_FILTER_INPUT',
			filter: 'yaml',
		}]);
	});

	test.each(['', ':flow'])('preserves singleton arrays and null with yaml%s', async mode => {
		const engine = createEngine({ filters: standardFilters });
		await expect(engine.renderOrThrow(`{{ value | yaml${mode} }}`, { variables: { value: ['one'] } }))
			.resolves.toBe(mode ? '["one"]' : '- "one"');
		await expect(engine.renderOrThrow(`{{ value | yaml${mode} }}`, { variables: { value: null } }))
			.resolves.toBe('null');
	});

	test('renders frontmatter with transformed wikilink lists', async () => {
		const engine = createEngine({ filters: standardFilters });
		const result = await engine.render([
			'---',
			'year: {{ year | yaml }}',
			'director:',
			'{{ directors | wikilink | yaml | indent:2 }}',
			'genre:',
			'{{ genres | yaml | indent:2 }}',
			'---',
		].join('\n'), { variables: {
			year: 1999,
			directors: ['Lana Wachowski', 'Lilly Wachowski'],
			genres: ['Action', 'Sci-fi'],
		} });
		expect(result.errors).toEqual([]);
		expect(result.warnings).toEqual([]);
		expect(result.output).toBe([
			'---', 'year: 1999', 'director:',
			'  - "[[Lana Wachowski]]"', '  - "[[Lilly Wachowski]]"',
			'genre:', '  - "Action"', '  - "Sci-fi"', '---',
		].join('\n'));
		expect(applyFiltersWithRegistry(
			['Lana Wachowski', 'Lilly Wachowski'], 'wikilink | yaml | indent:2',
			standardFilters, { variables: {} },
		)).toBe('  - "[[Lana Wachowski]]"\n  - "[[Lilly Wachowski]]"');
	});

	test.each(['"compact"', '"flow",2', '("flow",2)'])('rejects unsupported options: %s', param => {
		const engine = createEngine({ filters: standardFilters });
		expect(engine.validate(`{{ value | yaml:${param} }}`)[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
		});
	});
});
