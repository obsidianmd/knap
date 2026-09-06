import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../../src/filters';
import { map } from '../../src/filters/map';

const engine = createEngine({ filters: standardFilters });
const expression = 'item => ({label: "Last, First", url: "https://example.com"})';
const input = [{ id: 1 }];
const expected = JSON.stringify([{ label: 'Last, First', url: 'https://example.com' }]);

describe('map filter', () => {
	test('preserves commas and colons inside quoted object values', () => {
		expect(map(JSON.stringify(input), expression)).toBe(expected);
	});

	test('preserves quoted delimiters through both execution paths', async () => {
		await expect(engine.renderOrThrow(`{{ items | map:${expression} }}`, {
			variables: { items: input },
		})).resolves.toBe(expected);

		expect(applyFiltersWithRegistry(
			input,
			`map:${expression}`,
			standardFilters,
			{ variables: {} },
		)).toBe(expected);
	});
});
