import { describe, test, expect } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilters } from '../../src/filters';
import { join } from '../../src/filters/join';

const engine = createEngine({ filters: standardFilters });

describe('join filter', () => {
	test('combines array elements with comma by default', () => {
		expect(join('["a","b","c"]')).toBe('a,b,c');
	});

	test('joins with custom separator', () => {
		expect(join('["a","b","c"]', ' ')).toBe('a b c');
	});

	test('joins with newline separator', () => {
		expect(join('["a","b"]', '\\n')).toBe('a\nb');
	});

	test('handles single element', () => {
		expect(join('["only"]')).toBe('only');
	});

	test('handles empty array', () => {
		expect(join('[]')).toBe('');
	});

	test('returns original for non-JSON', () => {
		expect(join('hello')).toBe('hello');
	});

	test('joins with dash separator', () => {
		expect(join('["a","b","c"]', '-')).toBe('a-b-c');
	});

	test('preserves backslashes in separators', async () => {
		expect(join('["a","b"]', String.raw`"\\"`)).toBe(String.raw`a\\b`);

		const template = String.raw`{{ items | join:"\\\\" }}`;
		await expect(engine.renderOrThrow(template, {
			variables: { items: ['a', 'b'] },
		})).resolves.toBe(String.raw`a\\b`);
	});

	test('joins with quoted newline separator', () => {
		// When the renderer wraps actual newlines in quotes
		expect(join('["a","b"]', '"\n\n"')).toBe('a\n\nb');
	});
});
