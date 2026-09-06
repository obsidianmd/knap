import { describe, expect, test } from 'vitest';
import { createEngine } from '../../src/engine';
import { applyFiltersWithRegistry, standardFilters } from '../../src/filters';

const engine = createEngine({ filters: standardFilters });

describe('sum filter', () => {
	test('totals finite numbers and nonblank numeric strings', async () => {
		const values = [1, ' 2.5 ', '', 'no', null, false, Infinity, -3];
		await expect(engine.renderOrThrow('{{ values | sum }}', {
			variables: { values },
		})).resolves.toBe('0.5');
	});

	test('totals nested object properties', async () => {
		const items = [
			{ details: { amount: 2 } },
			{ details: { amount: '3.5' } },
			{ details: { amount: '' } },
			{},
		];
		await expect(engine.renderOrThrow('{{ items | sum:"details.amount" }}', {
			variables: { items },
		})).resolves.toBe('5.5');
		expect(applyFiltersWithRegistry(
			items,
			'sum:"details.amount"',
			standardFilters,
			{ variables: {} },
		)).toBe('5.5');
	});

	test('returns zero for empty arrays', async () => {
		await expect(engine.renderOrThrow('{{ values | sum }}', {
			variables: { values: [] },
		})).resolves.toBe('0');
	});

	test('passes non-array inputs through unchanged', async () => {
		await expect(engine.renderOrThrow('{{ value | sum }}', {
			variables: { value: 'plain' },
		})).resolves.toBe('plain');
	});
});
