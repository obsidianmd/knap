import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { standardFilterMetadata, standardFilters } from '../../src/filters';
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
		expect(standardFilterMetadata.yaml).toEqual({});
	});
});
