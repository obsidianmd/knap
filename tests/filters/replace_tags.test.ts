import { describe, test, expect } from 'vitest';
import { replace_tags } from '../../src/filters/replace_tags';

describe('replace_tags filter', () => {
	test('replaces HTML tags', () => {
		const result = replace_tags('<strong>text</strong>', '"strong":"h2"');
		expect(result).toBe('<h2>text</h2>');
	});

	test.each(['"strong":"h2"', 'strong:h2', '("strong":"h2")', '("strong", "h2")'])
		('accepts equivalent argument spelling %s', params => {
			expect(replace_tags('<strong>text</strong>', params)).toBe('<h2>text</h2>');
		});

	test('preserves source-only tag removal', () => {
		expect(replace_tags('<strong>text</strong>', 'strong')).toBe('text');
	});

	test('preserves content and attributes', () => {
		const result = replace_tags('<strong class="bold">text</strong>', '"strong":"em"');
		expect(result).toContain('<em');
		expect(result).toContain('text');
		expect(result).toContain('</em>');
	});

	test('handles multiple tags of same type', () => {
		const result = replace_tags('<b>one</b> and <b>two</b>', '"b":"strong"');
		expect(result).toContain('<strong>one</strong>');
		expect(result).toContain('<strong>two</strong>');
	});

	test('handles empty string', () => {
		expect(replace_tags('')).toBe('');
	});

	test('handles no matching tags', () => {
		expect(replace_tags('<p>text</p>', '"div":"span"')).toBe('<p>text</p>');
	});
});
