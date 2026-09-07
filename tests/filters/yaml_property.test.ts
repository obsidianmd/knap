import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('yaml_property filter', () => {
	test.each([
		[1999, 'year', 'year: 1999'],
		[false, 'enabled', 'enabled: false'],
		[null, 'rating', 'rating: null'],
		['', 'description', 'description: ""'],
		['007', 'id', 'id: "007"'],
		['first\nsecond', 'description', 'description: "first\\nsecond"'],
		['[not JSON]', 'value', 'value: "[not JSON]"'],
		[[], 'tags', 'tags: []'],
		[{}, 'details', 'details: {}'],
	])('places %j beside its key', async (value, key, expected) => {
		await expect(engine.renderOrThrow('{{ value | yaml_property:key }}', {
			variables: { value, key },
		})).resolves.toBe(expected);
	});

	test('nests arrays and objects with two-space indentation', async () => {
		const value = { year: 1999, genres: ['Action', 'Sci-fi'], cast: [{ name: 'Keanu', roles: ['Neo'] }] };
		await expect(engine.renderOrThrow('{{ value | yaml_property:"movie" }}', { variables: { value } }))
			.resolves.toBe([
				'movie:', '  year: 1999', '  genres:', '    - "Action"', '    - "Sci-fi"',
				'  cast:', '    - name: "Keanu"', '      roles:', '        - "Neo"',
			].join('\n'));
	});

	test.each(['genre', '"genre"', '("genre")'])('accepts the property name as %s', async param => {
		await expect(engine.renderOrThrow(`{{ value | yaml_property:${param} }}`, {
			variables: { value: '["Action","Sci-fi"]' },
		})).resolves.toBe('genre:\n  - "Action"\n  - "Sci-fi"');
	});

	test.each(['true', '007', '<<', 'A: #1', 'Last, first', 'line\nnext', '__proto__'])
		('serializes the key %j safely', async key => {
			const expectedKey = key === '__proto__' ? key : JSON.stringify(key);
			await expect(engine.renderOrThrow('{{ value | yaml_property:key }}', {
				variables: { value: ['one'], key },
			})).resolves.toBe(`${expectedKey}:\n  - "one"`);
		});

	test('preserves commas in a quoted property name', async () => {
		await expect(engine.renderOrThrow('{{ name | yaml_property:"Last, first" }}', {
			variables: { name: 'Wachowski, Lana' },
		})).resolves.toBe('"Last, first": "Wachowski, Lana"');
	});

	test('renders complete frontmatter with a transformed wikilink list', async () => {
		const result = await engine.render([
			'---', '{{ year | yaml_property:"year" }}',
			'{{ directors | wikilink | yaml_property:"director" }}',
			'{{ genres | yaml_property:"genre" }}', '---',
		].join('\n'), { variables: {
			year: 1999, directors: ['Lana Wachowski', 'Lilly Wachowski'], genres: ['Action', 'Sci-fi'],
		} });
		expect(result.errors).toEqual([]);
		expect(result.warnings).toEqual([]);
		expect(result.output).toBe([
			'---', 'year: 1999', 'director:', '  - "[[Lana Wachowski]]"', '  - "[[Lilly Wachowski]]"',
			'genre:', '  - "Action"', '  - "Sci-fi"', '---',
		].join('\n'));
		expect(applyFiltersWithRegistry(
			['Lana Wachowski'], 'wikilink | yaml_property:"director"', standardFilters, { variables: {} },
		)).toBe('director:\n  - "[[Lana Wachowski]]"');
	});

	test('keeps a single director as a list after wikilink formatting', async () => {
		await expect(engine.renderOrThrow('{{ directors | wikilink | yaml_property:"director" }}', {
			variables: { directors: ['Lana Wachowski'] },
		})).resolves.toBe('director:\n  - "[[Lana Wachowski]]"');
	});

	test('does not convert non-finite parsed numbers to null', async () => {
		const result = await engine.render('{{ value | yaml_property:"payload" }}', {
			variables: { value: '{"count":1e400}' },
		});
		expect(result.output).toBe('payload: "{\\"count\\":1e400}"');
		expect(result.errors).toEqual([]);
		expect(result.warnings).toMatchObject([{
			code: 'INVALID_FILTER_INPUT',
			filter: 'yaml_property',
		}]);
	});

	test.each(['', ':""', ':" "', ':("key", "other")'])('rejects missing or extra keys: %s', suffix => {
		expect(engine.validate(`{{ value | yaml_property${suffix} }}`)[0]).toMatchObject({
			code: 'INVALID_FILTER_ARGUMENTS',
		});
	});

	test('validates a dynamically resolved empty key', async () => {
		const result = await engine.render('{{ value | yaml_property:key }}', { variables: { value: 'one', key: '' } });
		expect(result.errors[0]).toMatchObject({ code: 'INVALID_FILTER_ARGUMENTS' });
	});
});
