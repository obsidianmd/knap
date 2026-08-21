import { describe, expect, test } from 'vitest';
import {
	applyFiltersWithRegistry,
	standardFilters,
	type FilterRegistry,
} from '../src';

describe('applyFiltersWithRegistry', () => {
	test('uses a custom registry and passes the host context', () => {
		const filters: FilterRegistry<{ origin: string }> = {
			upper: standardFilters.upper,
			origin: (value, _param, context) => `${value}@${context?.context?.origin}`,
		};

		const output = applyFiltersWithRegistry(
			'knap',
			'upper|origin',
			filters,
			{ variables: {}, context: { origin: 'https://obsidian.md' } },
		);

		expect(output).toBe('KNAP@https://obsidian.md');
	});
});
