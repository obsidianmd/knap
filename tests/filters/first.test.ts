import { describe, test, expect } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';
import { first } from '../../src/filters/first';

const engine = createEngine({ filters: standardFilters });

describe('first filter', () => {
	test('returns first element of array', () => {
		expect(first('["a","b","c"]')).toBe('a');
		expect(first('  ["a","b","c"]')).toBe('a');
	});

	test('returns input if not array', () => {
		expect(first('hello')).toBe('hello');
	});

	test('handles single element array', () => {
		expect(first('["only"]')).toBe('only');
	});

	test('handles array of numbers', () => {
		expect(first('[1,2,3]')).toBe(1);
	});

	test('handles empty array', () => {
		expect(first('[]')).toBeNull();
	});

	test('handles array of objects', () => {
		const result = first('[{"a":1},{"b":2}]');
		expect(result).toEqual({ a: 1 });
	});

	test('preserves a selected null value', () => {
		expect(first('[null,"x"]')).toBeNull();
	});

	test('preserves nested array shape', () => {
		expect(first('[[1,2],[3]]')).toEqual([1, 2]);
	});

	test('uses raw singleton collection shape', () => {
		expect(first('42', undefined, { variables: {}, rawValue: [42] })).toBe(42);
		expect(first('', undefined, { variables: {}, rawValue: [''] })).toBe('');
	});

	test('passes through non-array typed values', () => {
		const value = { a: 1 };
		expect(first('{"a":1}', undefined, { variables: {}, rawValue: value })).toBe(value);
	});

	test('renders an empty selection as empty text and serializes it as null', async () => {
		await expect(engine.renderOrThrow('{{ items | first }}', {
			variables: { items: [] },
		})).resolves.toBe('');
		await expect(engine.renderOrThrow('{{ items | first | yaml_property:"v" }}', {
			variables: { items: [] },
		})).resolves.toBe('v: null');
	});
});
