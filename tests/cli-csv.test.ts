import { describe, expect, test } from 'vitest';
import { parseCsv } from '../src/cli/csv';

describe('CSV batch data', () => {
	test('preserves string values, whitespace, literal keys, and empty fields', () => {
		expect(parseCsv('id,enabled, First name ,__proto__,empty\n00123,false, Ada ,value,', 'data.csv'))
			.toEqual([{ id: '00123', enabled: 'false', ' First name ': ' Ada ', ['__proto__']: 'value', empty: '' }]);
	});

	test.each(['\n', '\r\n', '\r'])('handles line endings (%j), escaped quotes, and trailing blank lines', newline => {
		expect(parseCsv(`\uFEFFname,note${newline}"A, B","He said ""Hi"""${newline}${newline}`, 'data.csv'))
			.toEqual([{ name: 'A, B', note: 'He said "Hi"' }]);
	});

	test('preserves newlines inside quoted values and quoted empty records', () => {
		expect(parseCsv('text\n"one\r\ntwo"\n""\n', 'data.csv'))
			.toEqual([{ text: 'one\r\ntwo' }, { text: '' }]);
	});

	test.each([
		['', 'column headers'], ['a,\n1,2', 'column headers'], ['a,a\n1,2', 'unique'],
		['a,b\n1', 'expected 2'], ['a\n1,2', 'expected 1'],
		['a\n"unclosed', 'Unclosed'], ['a\nun"quoted', 'unquoted'], ['a\n"value"extra', 'closing quote'],
	])('rejects malformed CSV (%j)', (input, message) => {
		expect(() => parseCsv(input, 'data.csv')).toThrow(message);
	});
});
