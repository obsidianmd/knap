import { describe, expect, test } from 'vitest';
import {
	applyFiltersWithRegistry,
	standardFilterMetadata,
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

	test('rejects asynchronous filters in the synchronous helper', () => {
		const filters: FilterRegistry = {
			async_filter: async value => value,
		};

		expect(() => applyFiltersWithRegistry(
			'knap',
			'async_filter',
			filters,
			{ variables: {} },
		)).toThrow('use engine.render() for async filters');
	});

	test('freezes standard filter metadata and each metadata entry', () => {
		expect(Object.isFrozen(standardFilterMetadata)).toBe(true);
		expect(Object.isFrozen(standardFilterMetadata.calc)).toBe(true);
	});
});
