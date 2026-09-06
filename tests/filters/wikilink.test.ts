import { describe, test, expect } from 'vitest';
import { embed, wikilink } from '../../src/filters/wikilink';

describe('wikilink filter', () => {
	test('creates wikilink from string', () => {
		expect(wikilink('page')).toBe('[[page]]');
	});

	test('creates wikilink with alias', () => {
		expect(wikilink('page', 'alias')).toBe('[[page|alias]]');
	});

	test('handles array of pages', () => {
		const result = wikilink('["page1","page2"]');
		expect(result).toContain('[[page1]]');
		expect(result).toContain('[[page2]]');
	});

	test('handles array with alias', () => {
		const result = wikilink('["page1","page2"]', 'alias');
		expect(result).toContain('[[page1|alias]]');
		expect(result).toContain('[[page2|alias]]');
	});

	test('handles object with aliases', () => {
		const result = wikilink('{"page1": "alias1", "page2": "alias2"}');
		expect(result).toContain('[[page1|alias1]]');
		expect(result).toContain('[[page2|alias2]]');
	});

	test('handles empty string', () => {
		// Empty string returns empty string (no wikilink created)
		expect(wikilink('')).toBe('');
	});

	test('removes quotes from alias parameter', () => {
		expect(wikilink('page', '"alias"')).toBe('[[page|alias]]');
	});
});

describe('embed filter', () => {
	test('creates embeds from strings with an optional alias', () => {
		expect(embed('image.png')).toBe('![[image.png]]');
		expect(embed('note', 'Preview')).toBe('![[note|Preview]]');
	});

	test('creates embeds from arrays and objects like wikilink', () => {
		expect(JSON.parse(embed('["one","two"]'))).toEqual(['![[one]]', '![[two]]']);
		expect(JSON.parse(embed('{"one":"First","two":"Second"}')))
			.toEqual(['![[one|First]]', '![[two|Second]]']);
	});
});
