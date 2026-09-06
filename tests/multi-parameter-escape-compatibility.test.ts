import { describe, expect, test } from 'vitest';
import { createEngine } from '../src/engine';
import { standardFilters } from '../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('multi-parameter filter escape compatibility', () => {
	test.each([
		{
			template: String.raw`{{ value | merge:("C:\\\\value") }}`,
			value: [],
			expected: JSON.stringify([String.raw`C:\\value`]),
		},
		{
			template: String.raw`{{ value | table:("C:\\\\header") }}`,
			value: [['cell']],
			expected: `| ${String.raw`C:\\header`} |\n| - |\n| cell |`,
		},
		{
			template: String.raw`{{ value | date:"YYYY\\\\MM" }}`,
			value: '2024-12-01',
			expected: String.raw`2024\\12`,
		},
		{
			template: String.raw`{{ value | number_format:(0,".","\\\\x") }}`,
			value: 1234,
			expected: String.raw`1\x234`,
		},
	])('preserves escapes in $template', async ({ template, value, expected }) => {
		await expect(engine.renderOrThrow(template, { variables: { value } }))
			.resolves.toBe(expected);
	});
});
