import { describe, test, expect } from 'vitest';
import { table, table_pretty } from '../../src/filters/table';

describe('table filter', () => {
	test('converts array of objects to markdown table', () => {
		const result = table('[{"name":"Alice","age":30},{"name":"Bob","age":25}]');
		expect(result).toContain('| name | age |');
		expect(result).toContain('| Alice | 30 |');
		expect(result).toContain('| Bob | 25 |');
	});

	test('creates table with separator row', () => {
		const result = table('[{"a":1}]');
		// Separator row uses "| - |" format
		expect(result).toContain('| - |');
	});

	test('handles simple array', () => {
		const result = table('["a","b","c"]');
		expect(result).toContain('| Value |');
	});

	test('handles custom column headers', () => {
		const result = table('["a","b","c","d"]', '("Col1", "Col2")');
		expect(result).toContain('| Col1 | Col2 |');
	});

	test('pretty-prints tables with padded columns and separators', () => {
		const result = table_pretty('[{"name":"Alice","age":30},{"name":"Bob","age":25}]');
		expect(result).toBe([
			'| name  | age |',
			'| ----- | --- |',
			'| Alice | 30  |',
			'| Bob   | 25  |',
		].join('\n'));
	});

	test('combines pretty formatting with custom headers', () => {
		const result = table_pretty('["Ada","Engineer","Lin","Designer"]', '("Name", "Role")');
		expect(result).toBe([
			'| Name | Role     |',
			'| ---- | -------- |',
			'| Ada  | Engineer |',
			'| Lin  | Designer |',
		].join('\n'));
	});

	test('keeps pretty available as a normal table header', () => {
		expect(table('["value"]', 'pretty')).toBe('| pretty |\n| - |\n| value |');
	});

	test('converts arrays of arrays into rows', () => {
		const result = table('[["Alice",30],["Bob",25]]', '("Name", "Age")');
		expect(result).toContain('| Name | Age |');
		expect(result).toContain('| Alice | 30 |');
		expect(result).toContain('| Bob | 25 |');
	});

	test('preserves cells beyond the supplied custom headers', () => {
		expect(table('[["Alice",30,"Admin"]]', '("Name", "Age")')).toBe([
			'| Name | Age |  |',
			'| - | - | - |',
			'| Alice | 30 | Admin |',
		].join('\n'));
	});

	test('preserves zero and false in object rows', () => {
		expect(table('[{"count":0,"enabled":false}]')).toBe([
			'| count | enabled |',
			'| - | - |',
			'| 0 | false |',
		].join('\n'));
	});

	test('supports commas inside quoted custom headers', () => {
		expect(table('[["Ada","Writer"]]', '("Name, full", "Role")'))
			.toContain('| Name, full | Role |');
	});

	test('preserves backslashes in custom headers', () => {
		expect(table('["value"]', String.raw`("C:\\header")`))
			.toContain(`| ${String.raw`C:\\header`} |`);
	});

	test('handles empty array', () => {
		// Empty array creates a default single-column table with no rows
		const result = table('[]');
		expect(result).toContain('| Value |');
	});

	test('returns original for non-JSON', () => {
		expect(table('plain text')).toBe('plain text');
	});
});
