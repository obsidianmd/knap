import { describe, test, expect } from 'vitest';
import { callout } from '../../src/filters/callout';
import { render } from '../../src/renderer';
import { applyFilters } from '../../src/filters';

describe('callout filter', () => {
	test('creates default info callout', () => {
		const result = callout('content');
		expect(result).toContain('[!info]');
		expect(result).toContain('content');
	});

	test('creates callout with custom type', () => {
		const result = callout('content', 'warning');
		expect(result).toContain('[!warning]');
	});

	test('creates callout with title', () => {
		const result = callout('content', '("note", "My Title")');
		expect(result).toContain('[!note]');
		expect(result).toContain('My Title');
	});

	test('handles empty content', () => {
		const result = callout('');
		expect(result).toContain('[!info]');
	});

	test('handles multiline content', () => {
		const result = callout('line1\nline2');
		expect(result).toContain('line1');
		expect(result).toContain('line2');
	});
});

describe('callout filter via renderer', () => {
	const createContext = (variables: Record<string, any> = {}) => ({
		variables,
		currentUrl: 'https://example.com',
		applyFilters,
	});

	test('callout with type, title, and fold state through template', async () => {
		const ctx = createContext({ msg: 'content' });
		const result = await render('{{msg|callout:("info","My Title",true)}}', ctx);
		expect(result.errors).toHaveLength(0);
		expect(result.output).toContain('[!info]-');
		expect(result.output).toContain('My Title');
		expect(result.output).toContain('content');
	});

	test('callout with just type through template', async () => {
		const ctx = createContext({ msg: 'content' });
		const result = await render('{{msg|callout:"warning"}}', ctx);
		expect(result.errors).toHaveLength(0);
		expect(result.output).toContain('[!warning]');
	});

	test('applies a callout filter to a string literal', async () => {
		const ctx = createContext();
		const result = await render('{{"prompt text"|callout:("info","Summary",false)}}', ctx);
		expect(result.errors).toHaveLength(0);
		expect(result.output).toBe('> [!info]+ Summary\n> prompt text');
	});
});
