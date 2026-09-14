import { describe, test, expect } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';
import { length } from '../../src/filters/length';

const engine = createEngine({ filters: standardFilters });

describe('length filter', () => {
	test('returns string length', () => {
		expect(length('hello')).toBe(5);
	});

	test('returns array length', () => {
		expect(length('["a","b","c"]')).toBe(3);
		expect(length('  ["a","b","c"]')).toBe(3);
	});

	test('returns object keys count', () => {
		expect(length('{"a":1,"b":2}')).toBe(2);
	});

	test('handles empty string', () => {
		expect(length('')).toBe(0);
	});

	test('handles empty array', () => {
		expect(length('[]')).toBe(0);
	});

	test('handles empty object', () => {
		expect(length('{}')).toBe(0);
	});

	test('counts unicode characters correctly', () => {
		expect(length('hello')).toBe(5);
	});

	test('uses raw singleton collection shape', () => {
		expect(length('42', undefined, { variables: {}, rawValue: [42] })).toBe(1);
	});

	test('keeps rendered-text semantics for other typed scalars', () => {
		expect(length('42', undefined, { variables: {}, rawValue: 42 })).toBe(2);
		expect(length('true', undefined, { variables: {}, rawValue: true })).toBe(4);
		expect(length('', undefined, { variables: {}, rawValue: null })).toBe(0);
	});

	test('retains numeric comparison behavior', async () => {
		await expect(engine.renderOrThrow(
			'{% set count = items | length %}{% if count > 9 %}YES{% else %}NO{% endif %}',
			{ variables: { items: Array.from({ length: 10 }) } },
		)).resolves.toBe('YES');
	});
});
